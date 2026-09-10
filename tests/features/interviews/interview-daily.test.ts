import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserInterviewCycle } from "@/lib/db/schema";
import type { CyclePageQuestionRow } from "@/features/interviews/server/interview-page.repository";

const findCycleForWeek = vi.fn();
const listCyclePageQuestions = vi.fn();

vi.mock("@/features/interviews/server/interview-cycle.repository", () => ({
  findCycleForWeek: (input: unknown) => findCycleForWeek(input),
}));
vi.mock("@/features/interviews/server/interview-page.repository", () => ({
  listCyclePageQuestions: (input: unknown) => listCyclePageQuestions(input),
}));

const { getDailyInterviewPrompt } = await import(
  "@/features/interviews/server/interview-daily.service"
);

const weekStart = new Date("2026-09-07T00:00:00Z");
const now = new Date("2026-09-08T12:00:00Z"); // day 2

const cycle = {
  id: "cycle-1",
  publicId: "cycle-pub-1",
  weekStart,
} as UserInterviewCycle;

function row(overrides: Partial<CyclePageQuestionRow>): CyclePageQuestionRow {
  return {
    questionPublicId: "q-pub",
    question: "A question about the role that is long enough",
    options: ["a", "b", "c", "d"],
    difficulty: "HARD",
    topic: "topic",
    bucket: "DAILY",
    dayIndex: 2,
    assignedOrder: 2,
    selectedOption: null,
    isCorrect: null,
    correctOption: 3,
    explanation: "SECRET_RATIONALE",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  findCycleForWeek.mockResolvedValue(cycle);
});

describe("getDailyInterviewPrompt", () => {
  it("is not due when the user has no cycle for the week", async () => {
    findCycleForWeek.mockResolvedValue(null);

    await expect(getDailyInterviewPrompt("u1", now)).resolves.toEqual({
      due: false,
    });
    expect(listCyclePageQuestions).not.toHaveBeenCalled();
  });

  it("returns today's two daily questions with no answer leaked", async () => {
    listCyclePageQuestions.mockResolvedValue([
      row({ questionPublicId: "d2a", dayIndex: 2, assignedOrder: 2 }),
      row({ questionPublicId: "d2b", dayIndex: 2, assignedOrder: 3 }),
      row({ questionPublicId: "d1a", dayIndex: 1, assignedOrder: 0 }),
      row({ questionPublicId: "d3a", dayIndex: 3, assignedOrder: 4 }),
      row({ questionPublicId: "p1", bucket: "PRACTICE", dayIndex: null }),
    ]);

    const result = await getDailyInterviewPrompt("u1", now);

    expect(result).toMatchObject({
      due: true,
      cyclePublicId: "cycle-pub-1",
      dayIndex: 2,
      answeredToday: 0,
    });
    if (!result.due) throw new Error("expected due");

    expect(result.questions.map((q) => q.questionPublicId)).toEqual([
      "d2a",
      "d2b",
    ]);
    for (const question of result.questions) {
      expect(question.answered).toBeNull();
    }
    expect(JSON.stringify(result.questions)).not.toContain("SECRET_RATIONALE");
    expect(JSON.stringify(result.questions)).not.toContain('"correctOption"');
  });

  it("counts a daily question already answered today", async () => {
    listCyclePageQuestions.mockResolvedValue([
      row({
        questionPublicId: "d2a",
        dayIndex: 2,
        selectedOption: 3,
        isCorrect: true,
      }),
      row({ questionPublicId: "d2b", dayIndex: 2 }),
    ]);

    const result = await getDailyInterviewPrompt("u1", now);

    if (!result.due) throw new Error("expected due");
    expect(result.answeredToday).toBe(1);
    expect(result.questions[0].answered).toEqual({
      selectedOption: 3,
      correct: true,
      correctOption: 3,
      explanation: "SECRET_RATIONALE",
    });
    expect(result.questions[1].answered).toBeNull();
  });

  it("is not due when today has no daily questions assigned", async () => {
    listCyclePageQuestions.mockResolvedValue([
      row({ questionPublicId: "d1a", dayIndex: 1 }),
      row({ questionPublicId: "p1", bucket: "PRACTICE", dayIndex: null }),
    ]);

    await expect(getDailyInterviewPrompt("u1", now)).resolves.toEqual({
      due: false,
    });
  });

  it("degrades to not-due when the read throws", async () => {
    listCyclePageQuestions.mockRejectedValue(new Error("db down"));

    await expect(getDailyInterviewPrompt("u1", now)).resolves.toEqual({
      due: false,
    });
  });
});
