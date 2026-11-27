import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ revokeWorkerTokensNamed: vi.fn(), createWorkerToken: vi.fn() }));

vi.mock("@/features/worker/server/token.repository", () => ({ revokeWorkerTokensNamed: mocks.revokeWorkerTokensNamed }));
vi.mock("@/features/worker/server/token.service", () => ({ createWorkerToken: mocks.createWorkerToken }));

const { connectExtension } = await import("@/features/extension/server/connect.service");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createWorkerToken.mockResolvedValue({ ok: true, token: "hlw_new" });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("connectExtension", () => {
  it("replaces the previous extension token so reconnecting never piles up tokens", async () => {
    vi.stubEnv("VERCEL_AUTOMATION_BYPASS_SECRET", "");

    expect(await connectExtension("user-1")).toEqual({ ok: true, token: "hlw_new", bypass: null });
    expect(mocks.revokeWorkerTokensNamed).toHaveBeenCalledWith({ userId: "user-1", name: "Browser extension" });
    expect(mocks.revokeWorkerTokensNamed.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.createWorkerToken.mock.invocationCallOrder[0],
    );
  });

  it("passes the Vercel protection bypass to the extension when the deployment has one", async () => {
    vi.stubEnv("VERCEL_AUTOMATION_BYPASS_SECRET", "bypass-secret");

    expect(await connectExtension("user-1")).toMatchObject({ bypass: "bypass-secret" });
  });

  it("reports when no token could be created", async () => {
    mocks.createWorkerToken.mockResolvedValue({ ok: false, message: "Revoke one first." });

    expect(await connectExtension("user-1")).toEqual({ ok: false, message: "Revoke one first." });
  });
});
