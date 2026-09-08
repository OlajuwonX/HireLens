import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserInterviewCycle } from "@/lib/db/schema";
import type { CycleQuestionRow } from "@/features/interviews/server/interview-cycle.repository";

const ensureInterviewPool = vi.fn();
const findCycleForWeek = vi.fn();
const listPoolQuestionIds = vi.fn();
const createCycleWithAssignments = vi.fn();
const listCycleQuestions = vi.fn();
const recordInterviewEvent = vi.fn();

vi.mock(
  "@/features/interviews/server/interview-generation.orchestrator",
  () => ({
    ensureInterviewPool: (input: unknown) => ensureInterviewPool(input),
  }),
);
vi.mock("@/features/interviews/server/interview-cycle.repository", () => ({
  findCycleForWeek: (input: unknown) => findCycleForWeek(input),
  listPoolQuestionIds: (id: string) => listPoolQuestionIds(id),
  createCycleWithAssignments: (input: unknown) =>
    createCycleWithAssignments(input),
  listCycleQuestions: (input: unknown) => listCycleQuestions(input),
}));
vi.mock("@/features/interviews/server/interview-observability", () => ({
  recordInterviewEvent: (event: string, fields: unknown) =>
    recordInterviewEvent(event, fields),
}));

const { getOrCreateInterviewCycle, getInterviewCycleView } = await import(
  "@/features/interviews/server/interview-cycle.service"
);

const weekStart = new Date("2026-09-07T00:00:00Z");

function cycle(overrides: Partial<UserInterviewCycle> = {}): UserInterviewCycle {
  return {
    id: "cycle-1",
    userId: "u1",
    poolId: "pool-1",
    weekStart,
    ...overrides,
  } as UserInterviewCycle;
}

function question(
  order: number,
  bucket: "DAILY" | "PRACTICE",
  dayIndex: number | null,
): CycleQuestionRow {
  return {
    assignmentId: `a-${order}`,
    questionPublicId: `pub-${order}`,
    bucket,
    dayIndex,
    assignedOrder: order,
    question: `Question ${order}`,
    options: ["a", "b", "c", "d"],
    difficulty: "EASY",
    topic: "t",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  listPoolQuestionIds.mockResolvedValue(
    Array.from({ length: 30 }, (_, i) => `q-${i}`),
  );
  createCycleWithAssignments.mockResolvedValue({
    created: true,
    cycle: cycle(),
  });
});

describe("getOrCreateInterviewCycle", () => {
  it("returns the existing cycle without touching the pool", async () => {
    findCycleForWeek.mockResolvedValue(cycle());

    const result = await getOrCreateInterviewCycle({
      userId: "u1",
      now: new Date("2026-09-09T10:00:00Z"),
    });

    expect(result).toEqual({
      status: "ready",
      cycle: cycle(),
      created: false,
    });
    expect(ensureInterviewPool).not.toHaveBeenCalled();
  });

  it("propagates a not-ready pool result and creates no cycle", async () => {
    findCycleForWeek.mockResolvedValue(null);
    ensureInterviewPool.mockResolvedValue({
      status: "quota_blocked",
      reason: "GLOBAL_LIMIT",
    });

    const result = await getOrCreateInterviewCycle({ userId: "u1" });

    expect(result).toEqual({ status: "quota_blocked", reason: "GLOBAL_LIMIT" });
    expect(createCycleWithAssignments).not.toHaveBeenCalled();
  });

  it("builds a cycle with 30 assignments when the pool is ready", async () => {
    findCycleForWeek.mockResolvedValue(null);
    ensureInterviewPool.mockResolvedValue({
      status: "ready",
      pool: { id: "pool-1", poolVersion: 1, questionCount: 30 },
      reused: true,
    });

    const result = await getOrCreateInterviewCycle({
      userId: "u1",
      now: new Date("2026-09-08T00:00:00Z"),
    });

    expect(result).toMatchObject({ status: "ready", created: true });
    const call = createCycleWithAssignments.mock.calls[0][0];
    expect(call.assignments).toHaveLength(30);
    expect(call.weekStart.toISOString()).toBe("2026-09-07T00:00:00.000Z");
    expect(recordInterviewEvent).toHaveBeenCalledWith(
      "cycle_started",
      expect.objectContaining({ cycleId: "cycle-1", poolReused: true }),
    );
  });

  it("fails safely when the pool does not have 30 questions", async () => {
    findCycleForWeek.mockResolvedValue(null);
    ensureInterviewPool.mockResolvedValue({
      status: "ready",
      pool: { id: "pool-1", poolVersion: 1, questionCount: 30 },
      reused: false,
    });
    listPoolQuestionIds.mockResolvedValue(["q-0", "q-1"]);

    const result = await getOrCreateInterviewCycle({ userId: "u1" });

    expect(result.status).toBe("failed");
    expect(createCycleWithAssignments).not.toHaveBeenCalled();
  });
});

describe("getInterviewCycleView", () => {
  beforeEach(() => {
    findCycleForWeek.mockResolvedValue(cycle());
    listCycleQuestions.mockResolvedValue([
      question(0, "DAILY", 1),
      question(1, "DAILY", 1),
      question(2, "DAILY", 2),
      question(3, "DAILY", 3),
      question(4, "PRACTICE", null),
      question(5, "PRACTICE", null),
    ]);
  });

  it("locks daily questions whose day has not arrived yet", async () => {
    const view = await getInterviewCycleView({
      userId: "u1",
      now: new Date("2026-09-08T12:00:00Z"),
    });

    if (view.status !== "ready") {
      throw new Error("expected a ready view");
    }

    expect(view.dayIndex).toBe(2);
    expect(view.available.map((q) => q.assignedOrder)).toEqual([0, 1, 2, 4, 5]);
    expect(view.locked.map((q) => q.assignedOrder)).toEqual([3]);
  });

  it("opens every daily question once the week has fully elapsed", async () => {
    const view = await getInterviewCycleView({
      userId: "u1",
      now: new Date("2026-09-20T12:00:00Z"),
    });

    if (view.status !== "ready") {
      throw new Error("expected a ready view");
    }

    expect(view.locked).toHaveLength(0);
    expect(view.available).toHaveLength(6);
  });
});
