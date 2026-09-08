import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserInterviewCycle } from "@/lib/db/schema";
import type { CycleAssignmentRow } from "@/features/interviews/server/interview-attempt.repository";

const findCycleForWeek = vi.fn();
const findCycleAssignmentByQuestionPublicId = vi.fn();
const insertAttempt = vi.fn();
const listCycleAttempts = vi.fn();

vi.mock("@/features/interviews/server/interview-cycle.repository", () => ({
  findCycleForWeek: (input: unknown) => findCycleForWeek(input),
}));
vi.mock("@/features/interviews/server/interview-attempt.repository", () => ({
  findCycleAssignmentByQuestionPublicId: (input: unknown) =>
    findCycleAssignmentByQuestionPublicId(input),
  insertAttempt: (input: unknown) => insertAttempt(input),
  listCycleAttempts: (input: unknown) => listCycleAttempts(input),
  isUniqueViolation: (error: unknown) =>
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505",
}));

const { submitInterviewAnswer, getCycleAttemptSummary } = await import(
  "@/features/interviews/server/interview-answer.service"
);

const weekStart = new Date("2026-09-07T00:00:00Z");
const now = new Date("2026-09-08T12:00:00Z"); // day 2

const cycle = { id: "cycle-1", weekStart } as UserInterviewCycle;

function assignment(
  overrides: Partial<CycleAssignmentRow> = {},
): CycleAssignmentRow {
  return {
    questionId: "q-1",
    bucket: "PRACTICE",
    dayIndex: null,
    options: ["a", "b", "c", "d"],
    correctOption: 2,
    explanation: "Because C is the defensible answer.",
    difficulty: "HARD",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  findCycleForWeek.mockResolvedValue(cycle);
  findCycleAssignmentByQuestionPublicId.mockResolvedValue(assignment());
  insertAttempt.mockResolvedValue({ id: "attempt-1" });
});

describe("submitInterviewAnswer", () => {
  it("scores a correct answer and returns the explanation only after submitting", async () => {
    const result = await submitInterviewAnswer({
      userId: "u1",
      questionPublicId: "pub-1",
      selectedOption: 2,
      now,
    });

    expect(result).toEqual({
      ok: true,
      questionPublicId: "pub-1",
      selectedOption: 2,
      correct: true,
      correctOption: 2,
      explanation: "Because C is the defensible answer.",
    });
    expect(insertAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        cycleId: "cycle-1",
        questionId: "q-1",
        isCorrect: true,
        difficulty: "HARD",
      }),
    );
  });

  it("still returns the correct answer when the user was wrong", async () => {
    const result = await submitInterviewAnswer({
      userId: "u1",
      questionPublicId: "pub-1",
      selectedOption: 0,
      now,
    });

    expect(result).toMatchObject({ ok: true, correct: false, correctOption: 2 });
    expect(insertAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ isCorrect: false }),
    );
  });

  it("rejects a forged / unassigned question id without persisting", async () => {
    findCycleAssignmentByQuestionPublicId.mockResolvedValue(null);

    const result = await submitInterviewAnswer({
      userId: "u1",
      questionPublicId: "pub-x",
      selectedOption: 1,
      now,
    });

    expect(result).toEqual({ ok: false, error: "FORGED_QUESTION" });
    expect(insertAttempt).not.toHaveBeenCalled();
  });

  it("locks a daily question whose day has not arrived", async () => {
    findCycleAssignmentByQuestionPublicId.mockResolvedValue(
      assignment({ bucket: "DAILY", dayIndex: 5 }),
    );

    const result = await submitInterviewAnswer({
      userId: "u1",
      questionPublicId: "pub-1",
      selectedOption: 2,
      now,
    });

    expect(result).toEqual({ ok: false, error: "LOCKED" });
    expect(insertAttempt).not.toHaveBeenCalled();
  });

  it("allows a daily question once its day has arrived", async () => {
    findCycleAssignmentByQuestionPublicId.mockResolvedValue(
      assignment({ bucket: "DAILY", dayIndex: 2 }),
    );

    const result = await submitInterviewAnswer({
      userId: "u1",
      questionPublicId: "pub-1",
      selectedOption: 2,
      now,
    });

    expect(result).toMatchObject({ ok: true });
  });

  it("rejects an out-of-range option", async () => {
    for (const selectedOption of [-1, 4, 1.5, Number.NaN]) {
      insertAttempt.mockClear();

      const result = await submitInterviewAnswer({
        userId: "u1",
        questionPublicId: "pub-1",
        selectedOption,
        now,
      });

      expect(result).toEqual({ ok: false, error: "INVALID_OPTION" });
      expect(insertAttempt).not.toHaveBeenCalled();
    }
  });

  it("does not re-score a question that was already answered", async () => {
    insertAttempt.mockRejectedValue({ code: "23505" });

    const result = await submitInterviewAnswer({
      userId: "u1",
      questionPublicId: "pub-1",
      selectedOption: 2,
      now,
    });

    expect(result).toEqual({ ok: false, error: "ALREADY_ANSWERED" });
  });

  it("returns NO_CYCLE when the user has no cycle for the current week", async () => {
    findCycleForWeek.mockResolvedValue(null);

    const result = await submitInterviewAnswer({
      userId: "u1",
      questionPublicId: "pub-1",
      selectedOption: 2,
      now,
    });

    expect(result).toEqual({ ok: false, error: "NO_CYCLE" });
    expect(findCycleAssignmentByQuestionPublicId).not.toHaveBeenCalled();
  });
});

describe("getCycleAttemptSummary", () => {
  it("counts attempted / correct / incorrect", async () => {
    listCycleAttempts.mockResolvedValue([
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
    ]);

    await expect(
      getCycleAttemptSummary({ userId: "u1", cycleId: "cycle-1" }),
    ).resolves.toEqual({ attempted: 3, correct: 2, incorrect: 1 });
  });
});
