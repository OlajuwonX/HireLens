import { beforeEach, describe, expect, it, vi } from "vitest";
import { faithfulResume, plant, sourceText } from "../../fixtures/rev/frontend-engineer";

const mocks = vi.hoisted(() => ({
  loadReviewContext: vi.fn(),
  findOwnedAnalysis: vi.fn(),
  findReviewByHash: vi.fn(),
  insertReview: vi.fn(),
  reserveUsage: vi.fn(),
  completeUsage: vi.fn(),
  failUsage: vi.fn(),
  reviewResume: vi.fn(),
}));

vi.mock("@/features/analyses/server/review-context", () => ({
  loadReviewContext: mocks.loadReviewContext,
  findOwnedAnalysis: mocks.findOwnedAnalysis,
}));
vi.mock("@/features/analyses/server/review.repository", () => ({
  findReviewByHash: mocks.findReviewByHash,
  insertReview: mocks.insertReview,
}));
vi.mock("@/features/usage/server/ai-usage.service", () => ({
  reserveUsage: mocks.reserveUsage,
  completeUsage: mocks.completeUsage,
  failUsage: mocks.failUsage,
}));

const { reviewApplicationResume } = await import("@/features/analyses/server/review.service");

const provider = {
  analyzeApplication: vi.fn(),
  extractJobPosting: vi.fn(),
  generateInterviewPool: vi.fn(),
  reviewResume: mocks.reviewResume,
};

const job = {
  id: "job-1",
  title: "Senior Frontend Engineer",
  company: "Northwind",
  location: null,
  workArrangement: "REMOTE",
  employmentType: "FULL_TIME",
  deadlineAt: null,
  source: null,
  sourceUrl: null,
  description: "React role",
  requirements: null,
};

function context(resume = faithfulResume()) {
  return {
    ok: true,
    job,
    analysis: { id: "analysis-1" },
    stored: { improvedResume: resume, traceability: [] },
    sourceText,
    corrections: [],
  };
}

const modelReview = (verdict = "APPROVED", issues: unknown[] = []) =>
  JSON.stringify({
    verdict,
    scores: {
      factualAccuracy: 95,
      requirementCoverage: 80,
      keywordRelevance: 80,
      bulletQuality: 80,
      readability: 90,
      atsStructure: 90,
    },
    issues,
    summary: "Looks accurate.",
  });

const row = (values: Record<string, unknown>) => ({ ...values, createdAt: new Date("2026-11-12") });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadReviewContext.mockResolvedValue(context());
  mocks.findReviewByHash.mockResolvedValue(null);
  mocks.reserveUsage.mockResolvedValue({ ok: true, reservationId: "res-1" });
  mocks.reviewResume.mockResolvedValue({ provider: "gemini", model: "m", rawResponse: modelReview(), durationMs: 5 });
  mocks.insertReview.mockImplementation(async (values) => row(values));
  mocks.failUsage.mockResolvedValue(undefined);
});

const run = () =>
  reviewApplicationResume({ userId: "user-1", publicId: "app-1", provider: provider as never });

describe("reviewApplicationResume", () => {
  it("reviews, saves and charges one review", async () => {
    const outcome = await run();

    expect(outcome).toMatchObject({ ok: true, reused: false, review: { verdict: "APPROVED" } });
    expect(mocks.reserveUsage).toHaveBeenCalledWith({ userId: "user-1", action: "RESUME_REVIEW" });
    expect(mocks.completeUsage).toHaveBeenCalledTimes(1);
  });

  it("sends the source, job, resume and automated findings to the reviewer", async () => {
    mocks.loadReviewContext.mockResolvedValue(context(plant("fabricated-technology")));

    await run();

    const content = mocks.reviewResume.mock.calls[0][0].content as string;

    expect(content).toContain("<source_evidence>");
    expect(content).toContain("<job_posting>");
    expect(content).toContain("<optimized_resume>");
    expect(content).toContain("GraphQL");
    expect(content).toMatch(/<automated_findings>[\s\S]*Skills not found/);
  });

  it("reuses a saved review for the same resume without spending quota", async () => {
    mocks.findReviewByHash.mockResolvedValue(
      row({
        verdict: "APPROVED",
        resultJson: { review: JSON.parse(modelReview()), validation: { issues: [], errorCount: 0 } },
      }),
    );

    expect(await run()).toMatchObject({ ok: true, reused: true });
    expect(mocks.reserveUsage).not.toHaveBeenCalled();
    expect(mocks.reviewResume).not.toHaveBeenCalled();
  });

  it("overrides a model approval when deterministic checks find fabrication", async () => {
    mocks.loadReviewContext.mockResolvedValue(context(plant("invented-metric")));

    await run();

    expect(mocks.insertReview.mock.calls[0][0].verdict).toBe("REJECTED");
  });

  it("stops at the daily limit without calling the model", async () => {
    mocks.reserveUsage.mockResolvedValue({ ok: false, reason: "DAILY_LIMIT", message: "Limit reached" });

    expect(await run()).toMatchObject({ ok: false, error: "LIMIT_REACHED" });
    expect(mocks.reviewResume).not.toHaveBeenCalled();
  });

  it("refunds the reservation when the model fails", async () => {
    mocks.reviewResume.mockRejectedValue(new Error("boom"));

    expect(await run()).toMatchObject({ ok: false, error: "FAILED" });
    expect(mocks.failUsage).toHaveBeenCalledTimes(1);
    expect(mocks.completeUsage).not.toHaveBeenCalled();
    expect(mocks.insertReview).not.toHaveBeenCalled();
  });

  it("refunds when the model returns malformed output", async () => {
    mocks.reviewResume.mockResolvedValue({ provider: "gemini", model: "m", rawResponse: "{}", durationMs: 1 });

    expect((await run()).ok).toBe(false);
    expect(mocks.failUsage).toHaveBeenCalledTimes(1);
  });

  it("explains why a review cannot run", async () => {
    mocks.loadReviewContext.mockResolvedValue({ ok: false, error: "NO_TEXT" });

    expect(await run()).toMatchObject({ ok: false, error: "NO_TEXT" });
    expect(mocks.reserveUsage).not.toHaveBeenCalled();
  });
});
