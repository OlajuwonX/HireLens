import { beforeEach, describe, expect, it, vi } from "vitest";
import { sealSecret } from "@/lib/crypto/secret-box";

const mocks = vi.hoisted(() => ({
  gmailClient: vi.fn(),
  findGmailConnection: vi.fn(),
  listActiveGmailConnections: vi.fn(),
  deleteGmailConnection: vi.fn(),
  checkGmailInbox: vi.fn(),
}));

vi.mock("@/features/responses/server/gmail/gmail-config", () => ({ gmailClient: mocks.gmailClient }));
vi.mock("@/features/responses/server/gmail/gmail.repository", () => ({
  findGmailConnection: mocks.findGmailConnection,
  listActiveGmailConnections: mocks.listActiveGmailConnections,
  deleteGmailConnection: mocks.deleteGmailConnection,
}));
vi.mock("@/features/responses/server/gmail/gmail-sync.service", () => ({ checkGmailInbox: mocks.checkGmailInbox }));

const { checkGmailNow, disconnectGmail, runGmailChecks } = await import("@/features/responses/server/gmail/gmail-run.service");

const config = { clientId: "c", clientSecret: "s", tokenKey: "k" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.gmailClient.mockReturnValue(config);
});

describe("runGmailChecks", () => {
  it("does nothing when Gmail is not set up on the server", async () => {
    mocks.gmailClient.mockReturnValue(null);

    expect(await runGmailChecks()).toEqual({ users: 0, checked: 0, stored: 0, failed: 0, skipped: true });
    expect(mocks.listActiveGmailConnections).not.toHaveBeenCalled();
  });

  it("checks every connected inbox and keeps going after a failure", async () => {
    mocks.listActiveGmailConnections.mockResolvedValue([{ userId: "a" }, { userId: "b" }]);
    mocks.checkGmailInbox
      .mockResolvedValueOnce({ ok: false, reconnect: true, message: "invalid_grant" })
      .mockResolvedValueOnce({ ok: true, checked: 4, stored: 2 });

    expect(await runGmailChecks()).toEqual({ users: 2, checked: 4, stored: 2, failed: 1, skipped: false });
  });

  it("stops starting new inboxes when the time budget is spent", async () => {
    mocks.listActiveGmailConnections.mockResolvedValue([{ userId: "a" }]);

    expect(await runGmailChecks(Date.now() - 300_000)).toMatchObject({ users: 0 });
  });
});

describe("checkGmailNow", () => {
  it("asks to connect first", async () => {
    mocks.findGmailConnection.mockResolvedValue(null);

    expect(await checkGmailNow("user-1")).toMatchObject({ ok: false, reconnect: true });
  });

  it("does not hit Gmail again within a minute", async () => {
    mocks.findGmailConnection.mockResolvedValue({ lastCheckedAt: new Date(Date.now() - 10_000) });

    expect(await checkGmailNow("user-1")).toEqual({ ok: true, checked: 0, stored: 0 });
    expect(mocks.checkGmailInbox).not.toHaveBeenCalled();
  });

  it("checks right away otherwise", async () => {
    const connection = { lastCheckedAt: null };

    mocks.findGmailConnection.mockResolvedValue(connection);
    mocks.checkGmailInbox.mockResolvedValue({ ok: true, checked: 1, stored: 1 });

    expect(await checkGmailNow("user-1")).toEqual({ ok: true, checked: 1, stored: 1 });
    expect(mocks.checkGmailInbox).toHaveBeenCalledWith(connection, config);
  });
});

describe("disconnectGmail", () => {
  it("deletes the connection and revokes the token at Google", async () => {
    const fetchImpl = vi.fn(async () => new Response(null)) as unknown as typeof fetch;

    mocks.deleteGmailConnection.mockResolvedValue({ refreshTokenCipher: sealSecret("r-1", "k") });

    await disconnectGmail("user-1", fetchImpl);

    expect(mocks.deleteGmailConnection).toHaveBeenCalledWith("user-1");
    expect(String((fetchImpl as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1].body)).toBe("token=r-1");
  });
});
