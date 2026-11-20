import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findActiveToken: vi.fn(),
  touchWorkerToken: vi.fn(),
  isRateLimited: vi.fn(),
  getAccountRecord: vi.fn(),
}));

vi.mock("@/features/worker/server/token.repository", () => ({
  findActiveToken: mocks.findActiveToken,
  touchWorkerToken: mocks.touchWorkerToken,
}));
vi.mock("@/lib/rate-limit", () => ({ isRateLimited: mocks.isRateLimited }));
vi.mock("@/features/auth/server/current-account", () => ({ getAccountRecord: mocks.getAccountRecord }));

const { authenticateWorker } = await import("@/features/worker/server/worker-auth");
const { generateWorkerToken, hashWorkerToken, readBearer, TOKEN_PREFIX } = await import("@/features/worker/token");

const { token, hash } = generateWorkerToken();
const request = (authorization?: string) =>
  new Request("https://hirelens.test/api/worker/ping", { headers: authorization ? { authorization } : {} });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isRateLimited.mockResolvedValue(false);
  mocks.findActiveToken.mockResolvedValue({ id: "row-1", publicId: "worker-1", userId: "user-1" });
  mocks.getAccountRecord.mockResolvedValue({ disabledAt: null, deletedAt: null });
});

describe("worker tokens", () => {
  it("are prefixed, random and stored only as a hash", () => {
    const other = generateWorkerToken();

    expect(token.startsWith(TOKEN_PREFIX)).toBe(true);
    expect(token).not.toBe(other.token);
    expect(hash).toBe(hashWorkerToken(token));
    expect(hash).not.toContain(token);
  });

  it("are read only from a bearer header with the right prefix", () => {
    expect(readBearer(`Bearer ${token}`)).toBe(token);
    expect(readBearer(token)).toBeNull();
    expect(readBearer("Bearer something-else")).toBeNull();
    expect(readBearer(null)).toBeNull();
  });
});

describe("authenticateWorker", () => {
  it("identifies the user and worker for a valid token", async () => {
    expect(await authenticateWorker(request(`Bearer ${token}`))).toEqual({ userId: "user-1", workerId: "worker-1" });
    expect(mocks.findActiveToken).toHaveBeenCalledWith(hash);
    expect(mocks.touchWorkerToken).toHaveBeenCalledWith("row-1");
  });

  it("rejects a missing, unknown or revoked token", async () => {
    expect(await authenticateWorker(request())).toBeNull();

    mocks.findActiveToken.mockResolvedValue(null);
    expect(await authenticateWorker(request(`Bearer ${token}`))).toBeNull();
  });

  it("rejects tokens of disabled or deleted accounts", async () => {
    mocks.getAccountRecord.mockResolvedValue({ disabledAt: new Date(), deletedAt: null });

    expect(await authenticateWorker(request(`Bearer ${token}`))).toBeNull();
  });

  it("rejects a token that is being hammered", async () => {
    mocks.isRateLimited.mockResolvedValue(true);

    expect(await authenticateWorker(request(`Bearer ${token}`))).toBeNull();
    expect(mocks.findActiveToken).not.toHaveBeenCalled();
  });
});
