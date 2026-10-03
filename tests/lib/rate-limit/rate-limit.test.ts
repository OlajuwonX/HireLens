import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { limitMock, envMock, captureException } = vi.hoisted(() => ({
  limitMock: vi.fn(),
  envMock: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/env/server", () => ({ getServerEnv: envMock }));
vi.mock("@sentry/nextjs", () => ({
  captureException,
  captureMessage: vi.fn(),
}));
vi.mock("@upstash/redis", () => ({ Redis: vi.fn() }));
vi.mock("@upstash/ratelimit", () => {
  const Ratelimit = vi.fn(function () {
    return { limit: limitMock };
  });

  return {
    Ratelimit: Object.assign(Ratelimit, { slidingWindow: vi.fn() }),
  };
});

async function load() {
  vi.resetModules();
  return import("@/lib/rate-limit");
}

const configured = {
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "token",
};

describe("isRateLimited", () => {
  beforeEach(() => {
    limitMock.mockReset();
    captureException.mockReset();
  });

  afterEach(() => {
    envMock.mockReset();
  });

  it("blocks once Upstash reports the limit is used up", async () => {
    envMock.mockReturnValue(configured);
    limitMock.mockResolvedValueOnce({ success: false });
    const { isRateLimited } = await load();

    await expect(isRateLimited("signInEmail", "a@b.com")).resolves.toBe(true);
  });

  it("allows requests that are under the limit", async () => {
    envMock.mockReturnValue(configured);
    limitMock.mockResolvedValueOnce({ success: true });
    const { isRateLimited } = await load();

    await expect(isRateLimited("signInIp", "203.0.113.7")).resolves.toBe(false);
  });

  it("never sends the raw email or IP to Upstash", async () => {
    envMock.mockReturnValue(configured);
    limitMock.mockResolvedValueOnce({ success: true });
    const { isRateLimited } = await load();

    await isRateLimited("signInEmail", "Person@Example.com");

    const sent = limitMock.mock.calls[0]?.[0] as string;
    expect(sent).toMatch(/^[0-9a-f]{64}$/);
    expect(sent).not.toContain("example");
  });

  it("fails open and reports when Upstash errors", async () => {
    envMock.mockReturnValue(configured);
    limitMock.mockRejectedValueOnce(new Error("upstash down"));
    const { isRateLimited } = await load();

    await expect(isRateLimited("signUpIp", "203.0.113.7")).resolves.toBe(false);
    expect(captureException).toHaveBeenCalled();
  });

  it("allows requests when Upstash is not configured", async () => {
    envMock.mockReturnValue({});
    const { isRateLimited } = await load();

    await expect(isRateLimited("signInIp", "203.0.113.7")).resolves.toBe(false);
    expect(limitMock).not.toHaveBeenCalled();
  });
});
