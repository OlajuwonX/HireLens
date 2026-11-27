import { beforeEach, describe, expect, it, vi } from "vitest";
import { sealSecret } from "@/lib/crypto/secret-box";

const mocks = vi.hoisted(() => ({
  existingMessageIds: vi.fn(),
  listApplicationCandidates: vi.fn(),
  ingestEmails: vi.fn(),
  recordGmailCheck: vi.fn(),
}));

vi.mock("@/features/responses/server/email.repository", () => ({
  existingMessageIds: mocks.existingMessageIds,
  listApplicationCandidates: mocks.listApplicationCandidates,
}));
vi.mock("@/features/responses/server/ingest.service", () => ({ ingestEmails: mocks.ingestEmails }));
vi.mock("@/features/responses/server/gmail/gmail.repository", () => ({ recordGmailCheck: mocks.recordGmailCheck }));

const { checkGmailInbox, inboxQuery, needsReconnect } = await import("@/features/responses/server/gmail/gmail-sync.service");

const config = { clientId: "client", clientSecret: "secret", tokenKey: "token-key" };
const connection = {
  id: "c-1",
  userId: "user-1",
  refreshTokenCipher: sealSecret("refresh-1", "token-key"),
  status: "CONNECTED" as const,
  lastCheckedAt: new Date("2026-11-20T10:00:00Z"),
  lastError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const encode = (text: string) => Buffer.from(text).toString("base64url");
const message = (id: string, from: string, subject: string) => ({
  id,
  threadId: `t-${id}`,
  internalDate: String(Date.parse("2026-11-21T09:00:00Z")),
  payload: {
    mimeType: "text/plain",
    headers: [
      { name: "From", value: from },
      { name: "Subject", value: subject },
    ],
    body: { data: encode(`${subject}. We would like to invite you to interview.`) },
  },
});

function googleFetch(options: { tokenStatus?: number } = {}) {
  const calls: string[] = [];
  const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);

    calls.push(url);

    if (url.includes("oauth2.googleapis.com/token")) {
      const body = String(init?.body);

      expect(body).toContain("refresh_token=refresh-1");

      return options.tokenStatus
        ? Response.json({ error: "invalid_grant" }, { status: options.tokenStatus })
        : Response.json({ access_token: "access-1" });
    }

    if (url.includes("/messages?")) {
      return Response.json({ messages: [{ id: "m-1" }, { id: "m-2" }, { id: "m-3" }] });
    }

    const id = url.split("/messages/")[1].split("?")[0];

    return Response.json(
      id === "m-1"
        ? message("m-1", "Acme Talent <talent@acme.com>", "Your application to Acme")
        : message(id, "Deals <deals@shop.test>", "50% off shoes"),
    );
  });

  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.existingMessageIds.mockResolvedValue(new Set(["m-3"]));
  mocks.listApplicationCandidates.mockResolvedValue([{ id: "a-1", company: "Acme", title: "Engineer" }]);
  mocks.ingestEmails.mockResolvedValue({ stored: 1 });
});

describe("checkGmailInbox", () => {
  it("stores only new replies from companies the user applied to", async () => {
    const google = googleFetch();

    expect(await checkGmailInbox(connection, config, google.fetchImpl)).toEqual({ ok: true, checked: 2, stored: 1 });
    expect(mocks.ingestEmails).toHaveBeenCalledWith({
      userId: "user-1",
      emails: [expect.objectContaining({ messageId: "m-1", from: "Acme Talent <talent@acme.com>", threadId: "t-m-1" })],
    });
    expect(google.calls.some((url) => url.endsWith("/messages/m-3?format=full"))).toBe(false);
    expect(mocks.recordGmailCheck).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", status: "CONNECTED", lastError: null, checkedAt: expect.any(Date) }),
    );
  });

  it("only asks Gmail for mail since shortly before the last check", async () => {
    const google = googleFetch();

    await checkGmailInbox(connection, config, google.fetchImpl);

    const list = decodeURIComponent(google.calls.find((url) => url.includes("/messages?")) ?? "");

    expect(list).toContain(`after:${Date.parse("2026-11-20T09:00:00Z") / 1000}`);
  });

  it("asks the user to reconnect when Google revokes access", async () => {
    const result = await checkGmailInbox(connection, config, googleFetch({ tokenStatus: 400 }).fetchImpl);

    expect(result).toMatchObject({ ok: false, reconnect: true });
    expect(mocks.recordGmailCheck).toHaveBeenCalledWith(expect.objectContaining({ status: "NEEDS_RECONNECT", checkedAt: null }));
    expect(mocks.ingestEmails).not.toHaveBeenCalled();
  });

  it("asks the user to reconnect when the stored token cannot be opened", async () => {
    const result = await checkGmailInbox({ ...connection, refreshTokenCipher: "broken" }, config, googleFetch().fetchImpl);

    expect(result).toMatchObject({ ok: false, reconnect: true });
  });
});

describe("inboxQuery", () => {
  it("reads the last three days on the first check", () => {
    expect(inboxQuery(null)).toContain("newer_than:3d");
    expect(inboxQuery(null)).not.toContain("after:");
  });
});

describe("needsReconnect", () => {
  it("separates revoked access from passing outages", () => {
    expect(needsReconnect("Google refused the request: invalid_grant")).toBe(true);
    expect(needsReconnect("Gmail responded with 503")).toBe(false);
  });
});
