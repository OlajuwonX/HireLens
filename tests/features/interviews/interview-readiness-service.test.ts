import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InterviewDifficulty } from "@/lib/db/schema";

const countCycleQuestionsByDifficulty = vi.fn();
const listStaleOpenCycles = vi.fn();
const closeCycle = vi.fn();
const listClosedCycles = vi.fn();
const listCycleAttempts = vi.fn();
const notifyUser = vi.fn();

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
vi.mock("@/features/notifications/server/notification.service", () => ({
  notifyUser: (input: unknown) => notifyUser(input),
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
  beforeEach(() => {
    closeCycle.mockResolvedValue(true);
    notifyUser.mockResolvedValue(true);
  });

  it("closes each prior-week open cycle with its computed score", async () => {
    listStaleOpenCycles.mockResolvedValue([
      { id: "old-1", weekStart: new Date("2026-08-31T00:00:00Z") },
    ]);
    countCycleQuestionsByDifficulty.mockResolvedValue(standardPool);
    listCycleAttempts.mockResolvedValue(
      Array.from({ length: 6 }, () => ({
        difficulty: "VERY_HARD" as InterviewDifficulty,
        isCorrect: true,
      })),
    );

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

  it("sends one weekly summary notification per cycle that it actually closed", async () => {
    listStaleOpenCycles.mockResolvedValue([
      { id: "old-1", weekStart: new Date("2026-08-31T00:00:00Z") },
    ]);
    countCycleQuestionsByDifficulty.mockResolvedValue(standardPool);
    listCycleAttempts.mockResolvedValue([
      { difficulty: "HARD" as InterviewDifficulty, isCorrect: true },
      { difficulty: "HARD" as InterviewDifficulty, isCorrect: false },
    ]);

    await closeStaleCyclesForUser({
      userId: "u1",
      now: new Date("2026-09-08T00:00:00Z"),
    });

    expect(notifyUser).toHaveBeenCalledTimes(1);
    expect(notifyUser).toHaveBeenCalledWith({
      userId: "u1",
      kind: "SYSTEM",
      title: "Interview week complete — 4% ready",
      body: "Week of 31 Aug: 2 of 30 answered, 1 correct. A fresh set is ready.",
    });
  });

  it("does not notify when the cycle was already closed by a concurrent run", async () => {
    listStaleOpenCycles.mockResolvedValue([
      { id: "old-1", weekStart: new Date("2026-08-31T00:00:00Z") },
    ]);
    countCycleQuestionsByDifficulty.mockResolvedValue(standardPool);
    listCycleAttempts.mockResolvedValue([]);
    closeCycle.mockResolvedValue(false);

    await closeStaleCyclesForUser({
      userId: "u1",
      now: new Date("2026-09-08T00:00:00Z"),
    });

    expect(notifyUser).not.toHaveBeenCalled();
  });

  it("wording softens when the user answered nothing", async () => {
    listStaleOpenCycles.mockResolvedValue([
      { id: "old-1", weekStart: new Date("2026-08-31T00:00:00Z") },
    ]);
    countCycleQuestionsByDifficulty.mockResolvedValue(standardPool);
    listCycleAttempts.mockResolvedValue([]);

    await closeStaleCyclesForUser({
      userId: "u1",
      now: new Date("2026-09-08T00:00:00Z"),
    });

    expect(notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Interview week complete — 0% ready",
        body: expect.stringContaining("didn't answer any questions"),
      }),
    );
  });

  it("does nothing when there are no stale open cycles", async () => {
    listStaleOpenCycles.mockResolvedValue([]);

    const closed = await closeStaleCyclesForUser({
      userId: "u1",
      now: new Date("2026-09-08T00:00:00Z"),
    });

    expect(closed).toBe(0);
    expect(closeCycle).not.toHaveBeenCalled();
    expect(notifyUser).not.toHaveBeenCalled();
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
