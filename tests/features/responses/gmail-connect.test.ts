import { beforeEach, describe, expect, it, vi } from "vitest";
import { openSecret } from "@/lib/crypto/secret-box";
import { readGmailResult, readPendingState } from "@/features/responses/gmail";

const mocks = vi.hoisted(() => ({ saveGmailConnection: vi.fn() }));

vi.mock("@/features/responses/server/gmail/gmail.repository", () => ({ saveGmailConnection: mocks.saveGmailConnection }));

const { finishGmailConnect, startGmailConnect } = await import("@/features/responses/server/gmail/gmail-oauth.service");

const config = { clientId: "client-1", clientSecret: "secret-1", tokenKey: "key-1" };
const tokens = (body: Record<string, unknown>) => vi.fn(async () => Response.json(body)) as unknown as typeof fetch;
const finish = (fetchImpl: typeof fetch) =>
  finishGmailConnect({ userId: "user-1", config, origin: "https://hirelens.test", code: "code-1", verifier: "v-1" }, fetchImpl);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("startGmailConnect", () => {
  it("asks Google for read-only Gmail access with PKCE and a callback on this site", () => {
    const { url, pending } = startGmailConnect(config, "https://hirelens.test");
    const params = new URL(url).searchParams;

    expect(params.get("scope")).toBe("https://www.googleapis.com/auth/gmail.readonly");
    expect(params.get("redirect_uri")).toBe("https://hirelens.test/api/gmail/callback");
    expect(params.get("access_type")).toBe("offline");
    expect(params.get("state")).toBe(pending.state);
    expect(params.get("code_challenge")).toBeTruthy();
    expect(pending.verifier.length).toBeGreaterThan(40);
  });
});

describe("finishGmailConnect", () => {
  it("stores the refresh token encrypted", async () => {
    const result = await finish(tokens({ access_token: "a", refresh_token: "r-1", scope: "https://www.googleapis.com/auth/gmail.readonly" }));
    const saved = mocks.saveGmailConnection.mock.calls[0][0];

    expect(result).toEqual({ ok: true });
    expect(saved.userId).toBe("user-1");
    expect(saved.refreshTokenCipher).not.toContain("r-1");
    expect(openSecret(saved.refreshTokenCipher, "key-1")).toBe("r-1");
  });

  it("refuses when the user unticked Gmail access", async () => {
    const result = await finish(tokens({ access_token: "a", refresh_token: "r", scope: "openid email" }));

    expect(result).toMatchObject({ ok: false });
    expect(mocks.saveGmailConnection).not.toHaveBeenCalled();
  });

  it("refuses when Google gives no lasting access", async () => {
    expect(await finish(tokens({ access_token: "a" }))).toMatchObject({ ok: false });
  });
});

describe("Gmail URL flags", () => {
  it("only accepts known results and well-formed pending state", () => {
    expect(readGmailResult("connected")).toBe("connected");
    expect(readGmailResult("toString")).toBeNull();
    expect(readPendingState(JSON.stringify({ state: "s", verifier: "v" }))).toEqual({ state: "s", verifier: "v" });
    expect(readPendingState("not json")).toBeNull();
    expect(readPendingState(undefined)).toBeNull();
  });
});
