import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InterviewQuestionPool } from "@/lib/db/schema";
import type { InterviewProfile } from "@/features/interviews/interview-profile";

const generateInterviewPoolCompletion = vi.fn();
const insertPoolQuestions = vi.fn();
const markPoolReady = vi.fn();
const markPoolFailed = vi.fn();

vi.mock("@/lib/ai", () => ({
  generateInterviewPoolCompletion: (input: unknown) =>
    generateInterviewPoolCompletion(input),
  describeAiFailure: (error: unknown) =>
    error instanceof Error ? error.message : "unknown",
}));

vi.mock("@/features/interviews/server/interview-pool.repository", () => ({
  markPoolReady: (input: unknown) => markPoolReady(input),
  markPoolFailed: (input: unknown) => markPoolFailed(input),
}));

vi.mock("@/features/interviews/server/interview-question.repository", () => ({
  insertPoolQuestions: (input: unknown) => insertPoolQuestions(input),
}));

const { generatePoolForClaim } = await import(
  "@/features/interviews/server/interview-pool-generation.service"
);

const pool = { id: "pool-1" } as InterviewQuestionPool;

const profile: InterviewProfile = {
  roleFamily: "frontend-engineering",
  seniorityBand: "senior",
  coreSkills: ["react", "typescript"],
  secondarySkills: ["css"],
  responsibilities: ["review pull requests"],
  targetRequirements: ["graphql"],
  topics: ["state management"],
};

function completion() {
  return {
    questions: Array.from({ length: 30 }, (_, i) => ({
      question: `q${i}`,
      options: ["a", "b", "c", "d"],
      correctOption: 0,
      explanation: "because",
      difficulty: "easy" as const,
      topic: "t",
    })),
    provider: "openrouter",
    model: "some-model",
    durationMs: 1234,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  insertPoolQuestions.mockResolvedValue([]);
  markPoolReady.mockResolvedValue(pool);
  markPoolFailed.mockResolvedValue(undefined);
});

describe("generatePoolForClaim", () => {
  it("persists questions and marks the pool ready on success", async () => {
    generateInterviewPoolCompletion.mockResolvedValue(completion());

    const result = await generatePoolForClaim({ pool, profile });

    expect(generateInterviewPoolCompletion).toHaveBeenCalledTimes(1);
    expect(insertPoolQuestions).toHaveBeenCalledWith({
      poolId: "pool-1",
      questions: expect.arrayContaining([expect.any(Object)]),
    });
    expect(markPoolReady).toHaveBeenCalledWith({
      poolId: "pool-1",
      provider: "openrouter",
      model: "some-model",
      questionCount: 30,
      generationDurationMs: 1234,
    });
    expect(markPoolFailed).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, questionCount: 30 });
  });

  it("marks the pool failed and skips persistence when generation throws", async () => {
    generateInterviewPoolCompletion.mockRejectedValue(
      new Error("model output failed validation"),
    );

    const result = await generatePoolForClaim({ pool, profile });

    expect(insertPoolQuestions).not.toHaveBeenCalled();
    expect(markPoolReady).not.toHaveBeenCalled();
    expect(markPoolFailed).toHaveBeenCalledWith({
      poolId: "pool-1",
      failureReason: "model output failed validation",
    });
    expect(result).toEqual({
      ok: false,
      poolId: "pool-1",
      reason: "model output failed validation",
    });
  });

  it("marks the pool failed when persistence throws", async () => {
    generateInterviewPoolCompletion.mockResolvedValue(completion());
    insertPoolQuestions.mockRejectedValue(new Error("db down"));

    const result = await generatePoolForClaim({ pool, profile });

    expect(markPoolReady).not.toHaveBeenCalled();
    expect(markPoolFailed).toHaveBeenCalledWith({
      poolId: "pool-1",
      failureReason: "PersistFailed db down",
    });
    expect(result).toMatchObject({ ok: false });
  });
});
