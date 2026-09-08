import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InterviewDifficulty, UserInterviewCycle } from "@/lib/db/schema";
import type { CycleAssignmentSummaryRow } from "@/features/interviews/server/interview-dashboard.repository";

const getInterviewEligibility = vi.fn();
const findCycleForWeek = vi.fn();
const listCycleAssignmentSummary = vi.fn();
const listCycleAttempts = vi.fn();

vi.mock("@/features/interviews/server/interview-eligibility.service", () => ({
  getInterviewEligibility: (id: string) => getInterviewEligibility(id),
}));
vi.mock("@/features/interviews/server/interview-cycle.repository", () => ({
  findCycleForWeek: (input: unknown) => findCycleForWeek(input),
}));
vi.mock("@/features/interviews/server/interview-dashboard.repository", () => ({
  listCycleAssignmentSummary: (id: string) => listCycleAssignmentSummary(id),
}));
vi.mock("@/features/interviews/server/interview-attempt.repository", () => ({
  listCycleAttempts: (input: unknown) => listCycleAttempts(input),
}));

const { getDashboardInterview } = await import(
  "@/features/interviews/server/interview-dashboard.service"
);

const weekStart = new Date("2026-09-07T00:00:00Z");

function assignments(): CycleAssignmentSummaryRow[] {
  const rows: CycleAssignmentSummaryRow[] = [];
  const plan: [InterviewDifficulty, number][] = [
    ["EASY", 6],
    ["CHALLENGING", 8],
    ["HARD", 10],
    ["VERY_HARD", 6],
  ];
  let n = 0;

  for (const [difficulty, count] of plan) {
    for (let i = 0; i < count; i++) {
      const daily = n < 14;
      rows.push({
        questionId: `q-${n}`,
        bucket: daily ? "DAILY" : "PRACTICE",
        dayIndex: daily ? Math.floor(n / 2) + 1 : null,
        difficulty,
      });
      n++;
    }
  }

  return rows;
}

beforeEach(() => {
  vi.clearAllMocks();
  getInterviewEligibility.mockResolvedValue({
    eligible: true,
    hasResume: true,
    hasJobContext: true,
    hasAnalysis: true,
  });
  findCycleForWeek.mockResolvedValue({
    id: "cycle-1",
    weekStart,
  } as UserInterviewCycle);
  listCycleAssignmentSummary.mockResolvedValue(assignments());
  listCycleAttempts.mockResolvedValue([]);
});

describe("getDashboardInterview", () => {
  it("reports missing prerequisites without reading a cycle", async () => {
    getInterviewEligibility.mockResolvedValue({
      eligible: false,
      hasResume: true,
      hasJobContext: false,
      hasAnalysis: false,
    });

    const result = await getDashboardInterview("u1");

    expect(result).toEqual({
      state: "prerequisites",
      hasResume: true,
      hasJobContext: false,
    });
    expect(findCycleForWeek).not.toHaveBeenCalled();
  });

  it("prompts to start when eligible with no cycle for the week", async () => {
    findCycleForWeek.mockResolvedValue(null);

    const result = await getDashboardInterview("u1");

    expect(result).toEqual({ state: "ready_to_start" });
    expect(listCycleAssignmentSummary).not.toHaveBeenCalled();
  });

  it("shows zero progress for a fresh cycle", async () => {
    const result = await getDashboardInterview(
      "u1",
      new Date("2026-09-08T12:00:00Z"),
    );

    expect(result).toMatchObject({
      state: "active",
      readiness: 0,
      total: 30,
      attempted: 0,
      correct: 0,
      incorrect: 0,
      remaining: 30,
      dayIndex: 2,
      dailyDueToday: 2,
      dailyAnsweredToday: 0,
      completed: false,
    });
  });

  it("counts progress and today's daily answers", async () => {
    listCycleAttempts.mockResolvedValue([
      { questionId: "q-0", isCorrect: true, difficulty: "EASY" },
      { questionId: "q-2", isCorrect: true, difficulty: "EASY" },
      { questionId: "q-3", isCorrect: false, difficulty: "EASY" },
    ]);

    const result = await getDashboardInterview(
      "u1",
      new Date("2026-09-08T12:00:00Z"),
    );

    if (result.state !== "active") {
      throw new Error("expected active");
    }

    expect(result.attempted).toBe(3);
    expect(result.correct).toBe(2);
    expect(result.incorrect).toBe(1);
    expect(result.remaining).toBe(27);
    // day 2 daily questions are q-2 and q-3; q-2 answered, q-3 answered
    expect(result.dailyDueToday).toBe(2);
    expect(result.dailyAnsweredToday).toBe(2);
    expect(result.readiness).toBeGreaterThan(0);
  });

  it("marks the week complete once every question is answered", async () => {
    listCycleAttempts.mockResolvedValue(
      assignments().map((a) => ({
        questionId: a.questionId,
        isCorrect: true,
        difficulty: a.difficulty,
      })),
    );

    const result = await getDashboardInterview(
      "u1",
      new Date("2026-09-13T12:00:00Z"),
    );

    expect(result).toMatchObject({
      state: "active",
      readiness: 100,
      attempted: 30,
      remaining: 0,
      completed: true,
    });
  });
});
