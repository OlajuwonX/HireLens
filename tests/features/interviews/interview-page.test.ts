import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InterviewDifficulty, UserInterviewCycle } from "@/lib/db/schema";
import type { CyclePageQuestionRow } from "@/features/interviews/server/interview-page.repository";

const findCycleForWeek = vi.fn();
const listCyclePageQuestions = vi.fn();
const closeStaleCyclesForUser = vi.fn();

vi.mock("@/features/interviews/server/interview-cycle.repository", () => ({
  findCycleForWeek: (input: unknown) => findCycleForWeek(input),
}));
vi.mock("@/features/interviews/server/interview-page.repository", () => ({
  listCyclePageQuestions: (input: unknown) => listCyclePageQuestions(input),
}));
vi.mock("@/features/interviews/server/interview-readiness.service", () => ({
  closeStaleCyclesForUser: (input: unknown) => closeStaleCyclesForUser(input),
}));

const { getInterviewPageData } = await import(
  "@/features/interviews/server/interview-page.service"
);

const weekStart = new Date("2026-09-07T00:00:00Z");

function row(
  order: number,
  overrides: Partial<CyclePageQuestionRow> = {},
): CyclePageQuestionRow {
  const daily = order < 14;

  return {
    questionPublicId: `pub-${order}`,
    question: `Question ${order}?`,
    options: ["a", "b", "c", "d"],
    difficulty: "HARD" as InterviewDifficulty,
    topic: "topic",
    bucket: daily ? "DAILY" : "PRACTICE",
    dayIndex: daily ? Math.floor(order / 2) + 1 : null,
    assignedOrder: order,
    selectedOption: null,
    isCorrect: null,
    correctOption: 1,
    explanation: `Secret rationale ${order}`,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  closeStaleCyclesForUser.mockResolvedValue(0);
  findCycleForWeek.mockResolvedValue({
    id: "cycle-1",
    publicId: "cycle-pub",
    weekStart,
  } as UserInterviewCycle);
});

describe("getInterviewPageData", () => {
  it("returns none when the user has no cycle for the week", async () => {
    findCycleForWeek.mockResolvedValue(null);

    await expect(
      getInterviewPageData({ userId: "u1" }),
    ).resolves.toEqual({ status: "none" });
    expect(listCyclePageQuestions).not.toHaveBeenCalled();
  });

  it("never leaks the correct answer or explanation for an unanswered question", async () => {
    listCyclePageQuestions.mockResolvedValue([row(0), row(14)]);

    const data = await getInterviewPageData({
      userId: "u1",
      now: new Date("2026-09-07T09:00:00Z"),
    });

    if (data.status !== "ready") {
      throw new Error("expected ready");
    }

    const all = [...data.dailyToday, ...data.practice];
    for (const question of all) {
      expect(question.answered).toBeNull();
      expect(JSON.stringify(question)).not.toContain("Secret rationale");
    }
  });

  it("exposes the answer only for questions that were answered", async () => {
    listCyclePageQuestions.mockResolvedValue([
      row(0, { selectedOption: 3, isCorrect: false }),
      row(1),
    ]);

    const data = await getInterviewPageData({
      userId: "u1",
      now: new Date("2026-09-07T09:00:00Z"),
    });

    if (data.status !== "ready") {
      throw new Error("expected ready");
    }

    const answered = data.dailyToday.find(
      (q) => q.questionPublicId === "pub-0",
    );
    const unanswered = data.dailyToday.find(
      (q) => q.questionPublicId === "pub-1",
    );

    expect(answered?.answered).toEqual({
      selectedOption: 3,
      correct: false,
      correctOption: 1,
      explanation: "Secret rationale 0",
    });
    expect(unanswered?.answered).toBeNull();
  });

  it("splits daily questions by day and counts the upcoming ones", async () => {
    const rows = Array.from({ length: 30 }, (_, i) => row(i));
    listCyclePageQuestions.mockResolvedValue(rows);

    const data = await getInterviewPageData({
      userId: "u1",
      now: new Date("2026-09-09T12:00:00Z"), // day 3
    });

    if (data.status !== "ready") {
      throw new Error("expected ready");
    }

    expect(data.dayIndex).toBe(3);
    expect(data.dailyToday).toHaveLength(6); // days 1-3, 2 each
    expect(data.dailyUpcoming).toBe(8); // days 4-7
    expect(data.practice).toHaveLength(16);
  });

  it("computes readiness and progress and the completed flag", async () => {
    const rows = Array.from({ length: 30 }, (_, i) =>
      row(i, {
        difficulty: "EASY",
        selectedOption: 1,
        isCorrect: true,
        dayIndex: i < 14 ? Math.floor(i / 2) + 1 : null,
      }),
    );
    listCyclePageQuestions.mockResolvedValue(rows);

    const data = await getInterviewPageData({
      userId: "u1",
      now: new Date("2026-09-20T12:00:00Z"),
    });

    expect(data).toMatchObject({
      status: "ready",
      readiness: 100,
      completed: true,
      progress: { attempted: 30, correct: 30, incorrect: 0, total: 30 },
    });
  });
});
