import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InterviewQuestionPool } from "@/lib/db/schema";

const getInterviewEligibility = vi.fn();
const getInterviewProfile = vi.fn();
const resolveInterviewPool = vi.fn();
const generatePoolForClaim = vi.fn();
const markPoolFailed = vi.fn();
const reserveUsage = vi.fn();
const completeUsage = vi.fn();
const failUsage = vi.fn();
const recordInterviewEvent = vi.fn();

vi.mock("@/features/interviews/server/interview-eligibility.service", () => ({
  getInterviewEligibility: (id: string) => getInterviewEligibility(id),
}));
vi.mock("@/features/interviews/server/interview-profile.service", () => ({
  getInterviewProfile: (id: string) => getInterviewProfile(id),
}));
vi.mock("@/features/interviews/server/interview-pool-cache.service", () => ({
  resolveInterviewPool: (input: unknown) => resolveInterviewPool(input),
}));
vi.mock("@/features/interviews/server/interview-pool-generation.service", () => ({
  generatePoolForClaim: (input: unknown) => generatePoolForClaim(input),
}));
vi.mock("@/features/interviews/server/interview-pool.repository", () => ({
  markPoolFailed: (input: unknown) => markPoolFailed(input),
}));
vi.mock("@/features/usage/server/ai-usage.service", () => ({
  reserveUsage: (input: unknown) => reserveUsage(input),
  completeUsage: (input: unknown) => completeUsage(input),
  failUsage: (input: unknown) => failUsage(input),
}));
vi.mock("@/features/interviews/server/interview-observability", () => ({
  recordInterviewEvent: (event: string, fields: unknown) =>
    recordInterviewEvent(event, fields),
}));

const { ensureInterviewPool } = await import(
  "@/features/interviews/server/interview-generation.orchestrator"
);

const profile = {
  roleFamily: "frontend-engineering",
  seniorityBand: "senior",
  coreSkills: ["react", "typescript"],
  secondarySkills: [],
  responsibilities: [],
  targetRequirements: [],
  topics: [],
};

const resolved = { profile, fingerprint: "fp-1", fromAnalysis: true };

function pool(overrides: Partial<InterviewQuestionPool> = {}) {
  return {
    id: "pool-1",
    poolVersion: 1,
    questionCount: 30,
    ...overrides,
  } as InterviewQuestionPool;
}

function events() {
  return recordInterviewEvent.mock.calls.map((call) => call[0]);
}

beforeEach(() => {
  vi.clearAllMocks();
  getInterviewEligibility.mockResolvedValue({
    eligible: true,
    hasResume: true,
    hasJobContext: true,
    hasAnalysis: true,
  });
  getInterviewProfile.mockResolvedValue(resolved);
  reserveUsage.mockResolvedValue({ ok: true, reservationId: "res-1" });
  completeUsage.mockResolvedValue(undefined);
  failUsage.mockResolvedValue(undefined);
  markPoolFailed.mockResolvedValue(undefined);
});

describe("ensureInterviewPool", () => {
  it("stops at eligibility without profiling or reserving", async () => {
    getInterviewEligibility.mockResolvedValue({
      eligible: false,
      hasResume: true,
      hasJobContext: false,
      hasAnalysis: false,
    });

    const result = await ensureInterviewPool({ userId: "u1" });

    expect(result).toMatchObject({ status: "ineligible" });
    expect(getInterviewProfile).not.toHaveBeenCalled();
    expect(resolveInterviewPool).not.toHaveBeenCalled();
    expect(reserveUsage).not.toHaveBeenCalled();
  });

  it("returns no_source when there is no profile source", async () => {
    getInterviewProfile.mockResolvedValue(null);

    const result = await ensureInterviewPool({ userId: "u1" });

    expect(result).toEqual({ status: "no_source" });
    expect(reserveUsage).not.toHaveBeenCalled();
  });

  it("a cache hit costs zero AI and logs reuse", async () => {
    resolveInterviewPool.mockResolvedValue({
      status: "reuse",
      pool: pool(),
      recycled: false,
    });

    const result = await ensureInterviewPool({ userId: "u1" });

    expect(result).toMatchObject({ status: "ready", reused: true });
    expect(reserveUsage).not.toHaveBeenCalled();
    expect(generatePoolForClaim).not.toHaveBeenCalled();
    expect(events()).toEqual(
      expect.arrayContaining(["cache_hit", "questions_reused"]),
    );
  });

  it("a lock-held pending resolution costs zero AI", async () => {
    resolveInterviewPool.mockResolvedValue({ status: "pending" });

    const result = await ensureInterviewPool({ userId: "u1" });

    expect(result).toEqual({ status: "pending" });
    expect(reserveUsage).not.toHaveBeenCalled();
    expect(events()).toContain("cache_miss");
  });

  it("a cache miss reserves, generates, then completes the usage", async () => {
    resolveInterviewPool.mockResolvedValue({
      status: "generate",
      pool: pool(),
    });
    generatePoolForClaim.mockResolvedValue({
      ok: true,
      poolId: "pool-1",
      questionCount: 30,
      provider: "openrouter",
      model: "m",
    });

    const result = await ensureInterviewPool({ userId: "u1" });

    expect(result).toMatchObject({ status: "ready", reused: false });
    expect(reserveUsage).toHaveBeenCalledWith({
      userId: "u1",
      action: "INTERVIEW_POOL_GENERATION",
    });
    expect(completeUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "INTERVIEW_POOL_GENERATION",
        reservationId: "res-1",
        inputHash: "fp-1",
        provider: "openrouter",
      }),
    );
    expect(failUsage).not.toHaveBeenCalled();
    expect(events()).toEqual(
      expect.arrayContaining(["cache_miss", "pool_generated", "provider_used"]),
    );
  });

  it("a quota refusal releases the pool and never calls the model", async () => {
    resolveInterviewPool.mockResolvedValue({
      status: "generate",
      pool: pool(),
    });
    reserveUsage.mockResolvedValue({
      ok: false,
      reason: "GLOBAL_LIMIT",
      message: "no budget",
      resetAt: new Date(),
    });

    const result = await ensureInterviewPool({ userId: "u1" });

    expect(result).toEqual({ status: "quota_blocked", reason: "GLOBAL_LIMIT" });
    expect(generatePoolForClaim).not.toHaveBeenCalled();
    expect(markPoolFailed).toHaveBeenCalledWith({
      poolId: "pool-1",
      failureReason: "QuotaRefused:GLOBAL_LIMIT",
    });
    expect(completeUsage).not.toHaveBeenCalled();
    expect(events()).toContain("quota_refusal");
  });

  it("a failed generation fails the usage instead of completing it", async () => {
    resolveInterviewPool.mockResolvedValue({
      status: "generate",
      pool: pool(),
    });
    generatePoolForClaim.mockResolvedValue({
      ok: false,
      poolId: "pool-1",
      reason: "model output failed validation",
    });

    const result = await ensureInterviewPool({ userId: "u1" });

    expect(result).toEqual({
      status: "failed",
      reason: "model output failed validation",
    });
    expect(failUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "INTERVIEW_POOL_GENERATION",
        reservationId: "res-1",
        failureReason: "model output failed validation",
      }),
    );
    expect(completeUsage).not.toHaveBeenCalled();
    expect(events()).toContain("generation_failure");
  });
});
