import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { isRelevant } from "../src/gmail/filter";
import { buildAuthUrl, createPkce, exchangeCode, GMAIL_SCOPE, loadRefreshToken, saveRefreshToken } from "../src/gmail/oauth";
import { parseMessage, type GmailMessage } from "../src/gmail/parse";
import { loadSeen, pollEmails } from "../src/gmail/poll";

const encode = (text: string) => Buffer.from(text, "utf8").toString("base64url");

function message(id: string, from: string, subject: string, body: string, mimeType = "text/plain"): GmailMessage {
  return {
    id,
    threadId: `t-${id}`,
    internalDate: String(Date.parse("2026-11-12T10:00:00Z")),
    payload: {
      mimeType: "multipart/alternative",
      headers: [
        { name: "From", value: from },
        { name: "Subject", value: subject },
      ],
      parts: [{ mimeType, body: { data: encode(body) } }],
    },
  };
}

const watch = { terms: ["stripe", "acme"], domains: ["greenhouse.io"] };

describe("parseMessage", () => {
  it("reads headers, date and plain text", () => {
    expect(parseMessage(message("m1", "Jane <jane@stripe.com>", "Interview", "Hello Ada"))).toEqual({
      messageId: "m1",
      threadId: "t-m1",
      from: "Jane <jane@stripe.com>",
      subject: "Interview",
      receivedAt: "2026-11-12T10:00:00.000Z",
      text: "Hello Ada",
    });
  });

  it("falls back to HTML converted to text", () => {
    const parsed = parseMessage(message("m2", "a@b.co", "Hi", "<p>Hello&nbsp;<b>Ada</b></p><script>x()</script>", "text/html"));

    expect(parsed.text).toBe("Hello Ada");
  });

  it("caps very long bodies", () => {
    expect(parseMessage(message("m3", "a@b.co", "Hi", "x".repeat(10_000))).text).toHaveLength(6_000);
  });
});

describe("isRelevant keeps unrelated email on the computer", () => {
  const parsed = (from: string, subject: string, body = "") => parseMessage(message("m", from, subject, body));

  it("passes job-board mail and companies the candidate applied to", () => {
    expect(isRelevant(parsed("no-reply@greenhouse.io", "Update"), watch)).toBe(true);
    expect(isRelevant(parsed("talent@stripe.com", "Hello"), watch)).toBe(true);
    expect(isRelevant(parsed("hr@other.com", "Your Acme application"), watch)).toBe(true);
  });

  it("drops everything else", () => {
    expect(isRelevant(parsed("mum@family.com", "Dinner on Sunday"), watch)).toBe(false);
    expect(isRelevant(parsed("deals@shop.com", "Big sale"), watch)).toBe(false);
  });
});

describe("Gmail OAuth", () => {
  it("asks only for read-only access with PKCE and a refresh token", () => {
    const { challenge, verifier } = createPkce();
    const url = new URL(buildAuthUrl({ clientId: "client", redirectUri: "http://127.0.0.1:5555", challenge, state: "s" }));

    expect(url.searchParams.get("scope")).toBe(GMAIL_SCOPE);
    expect(GMAIL_SCOPE.endsWith("gmail.readonly")).toBe(true);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(verifier).not.toBe(challenge);
  });

  it("exchanges the code and explains a refusal", async () => {
    const ok = vi.fn(async () => Response.json({ access_token: "a", refresh_token: "r" }));
    const refused = vi.fn(async () => Response.json({ error: "invalid_grant" }, { status: 400 }));
    const input = { clientId: "c", code: "x", verifier: "v", redirectUri: "http://127.0.0.1:1" };

    expect(await exchangeCode(input, ok as typeof fetch)).toMatchObject({ refresh_token: "r" });
    await expect(exchangeCode(input, refused as typeof fetch)).rejects.toThrow("invalid_grant");
  });

  it("stores the refresh token locally", async () => {
    const file = join(await mkdtemp(join(tmpdir(), "gmail-")), "token.json");

    await saveRefreshToken("refresh-1", file);

    expect(await loadRefreshToken(file)).toBe("refresh-1");
    expect(await loadRefreshToken(join(tmpdir(), "missing.json"))).toBeNull();
  });
});

describe("pollEmails", () => {
  const inbox = [
    message("m1", "talent@stripe.com", "Invitation to interview", "Book a time"),
    message("m2", "mum@family.com", "Dinner", "Sunday?"),
  ];
  const gmail = {
    listIds: vi.fn(async () => inbox.map((item) => item.id)),
    get: vi.fn(async (id: string) => inbox.find((item) => item.id === id)!),
  };

  it("sends only relevant emails and remembers what it checked", async () => {
    const stateFile = join(await mkdtemp(join(tmpdir(), "gmail-")), "state.json");
    const api = { emailWatch: vi.fn(async () => watch), sendEmails: vi.fn(async (_emails: { messageId: string }[]) => undefined) };

    expect(await pollEmails({ gmail, api, stateFile })).toEqual({ checked: 2, sent: 1 });
    expect(api.sendEmails.mock.calls[0]![0].map((email) => email.messageId)).toEqual(["m1"]);
    expect(await loadSeen(stateFile)).toEqual(["m1", "m2"]);

    expect(await pollEmails({ gmail, api, stateFile })).toEqual({ checked: 0, sent: 0 });
  });

  it("retries next time when HireLens cannot be reached", async () => {
    const stateFile = join(await mkdtemp(join(tmpdir(), "gmail-")), "state.json");
    const api = { emailWatch: vi.fn(async () => watch), sendEmails: vi.fn(async () => Promise.reject(new Error("offline"))) };

    await expect(pollEmails({ gmail, api, stateFile })).rejects.toThrow("offline");
    expect(await loadSeen(stateFile)).toEqual([]);
  });
});
