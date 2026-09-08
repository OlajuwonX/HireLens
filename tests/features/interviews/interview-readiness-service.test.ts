import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InterviewDifficulty } from "@/lib/db/schema";

const countCycleQuestionsByDifficulty = vi.fn();
const listStaleOpenCycles = vi.fn();
const closeCycle = vi.fn();
const listClosedCycles = vi.fn();
const listCycleAttempts = vi.fn();

vi.mock("@/features/interviews/server/interview-readiness.repository", () => ({
  countCycleQuestionsByDifficulty: (id: string) =>
    countCycleQuestionsByDifficulty(id),
  listStaleOpenCycles: (input: unknown) => listStaleOpenCycles(input),
  closeCycle: (input: unknown) => closeCycle(input),
  listClosedCycles: (id: string) => listClosedCycles(id),
}));
vi.mock("@/features/interviews/server/interview-attempt.repository", () => ({
  listCycleAttempts: (input: unknown) => listCycleAttempts(input),
}));

const { getCycleReadiness, closeStaleCyclesForUser, getReadinessHistory } =
  await import("@/features/interviews/server/interview-readiness.service");

const standardPool: { difficulty: InterviewDifficulty; count: number }[] = [
  { difficulty: "EASY", count: 6 },
  { difficulty: "CHALLENGING", count: 8 },
  { difficulty: "HARD", count: 10 },
  { difficulty: "VERY_HARD", count: 6 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCycleReadiness", () => {
  it("combines the assigned breakdown with the attempts", async () => {
    countCycleQuestionsByDifficulty.mockResolvedValue(standardPool);
    listCycleAttempts.mockResolvedValue([
      { difficulty: "HARD", isCorrect: true },
      { difficulty: "HARD", isCorrect: true },
      { difficulty: "EASY", isCorrect: false },
    ]);

    await expect(
      getCycleReadiness({ userId: "u1", cycleId: "c1" }),
    ).resolves.toEqual({ readiness: 8, earnedPoints: 6, totalPoints: 76 });
  });
});

describe("closeStaleCyclesForUser", () => {
  it("closes each prior-week open cycle with its computed score", async () => {
    listStaleOpenCycles.mockResolvedValue([
      { id: "old-1", weekStart: new Date("2026-08-31T00:00:00Z") },
    ]);
    countCycleQuestionsByDifficulty.mockResolvedValue(standardPool);
    listCycleAttempts.mockResolvedValue([
      { difficulty: "VERY_HARD", isCorrect: true },
      { difficulty: "VERY_HARD", isCorrect: true },
      { difficulty: "VERY_HARD", isCorrect: true },
      { difficulty: "VERY_HARD", isCorrect: true },
      { difficulty: "VERY_HARD", isCorrect: true },
      { difficulty: "VERY_HARD", isCorrect: true },
    ]);
    closeCycle.mockResolvedValue(undefined);

    const closed = await closeStaleCyclesForUser({
      userId: "u1",
      now: new Date("2026-09-08T00:00:00Z"),
    });

    expect(closed).toBe(1);
    expect(closeCycle).toHaveBeenCalledWith({
      cycleId: "old-1",
      readinessScore: 32,
      closedAt: new Date("2026-09-08T00:00:00Z"),
    });
  });

  it("does nothing when there are no stale open cycles", async () => {
    listStaleOpenCycles.mockResolvedValue([]);

    const closed = await closeStaleCyclesForUser({
      userId: "u1",
      now: new Date("2026-09-08T00:00:00Z"),
    });

    expect(closed).toBe(0);
    expect(closeCycle).not.toHaveBeenCalled();
  });
});

describe("getReadinessHistory", () => {
  it("maps closed cycles to trend points", async () => {
    listClosedCycles.mockResolvedValue([
      {
        publicId: "week-1",
        weekStart: new Date("2026-08-24T00:00:00Z"),
        readinessScore: 52,
      },
      {
        publicId: "week-2",
        weekStart: new Date("2026-08-31T00:00:00Z"),
        readinessScore: null,
      },
    ]);

    await expect(getReadinessHistory("u1")).resolves.toEqual([
      {
        cyclePublicId: "week-1",
        weekStart: new Date("2026-08-24T00:00:00Z"),
        readiness: 52,
      },
      {
        cyclePublicId: "week-2",
        weekStart: new Date("2026-08-31T00:00:00Z"),
        readiness: 0,
      },
    ]);
  });
});
