import "server-only";

import type { UserInterviewCycle } from "@/lib/db/schema";
import { INTERVIEW_POOL_SIZE } from "../constants";
import { buildCycleAssignments } from "../cycle-assignment";
import { getCycleDayIndex, getWeekStart } from "../week";
import {
  ensureInterviewPool,
  type EnsureInterviewPoolResult,
} from "./interview-generation.orchestrator";
import {
  createCycleWithAssignments,
  findCycleForWeek,
  listCycleQuestions,
  listPoolQuestionIds,
  type CycleQuestionRow,
} from "./interview-cycle.repository";
import { recordInterviewEvent } from "./interview-observability";

type PoolNotReady = Exclude<EnsureInterviewPoolResult, { status: "ready" }>;

export type InterviewCycleResult =
  | { status: "ready"; cycle: UserInterviewCycle; created: boolean }
  | PoolNotReady;

export async function getOrCreateInterviewCycle(input: {
  userId: string;
  now?: Date;
}): Promise<InterviewCycleResult> {
  const now = input.now ?? new Date();
  const weekStart = getWeekStart(now);

  const existing = await findCycleForWeek({ userId: input.userId, weekStart });

  if (existing) {
    return { status: "ready", cycle: existing, created: false };
  }

  const poolResult = await ensureInterviewPool({ userId: input.userId });

  if (poolResult.status !== "ready") {
    return poolResult;
  }

  const questionIds = await listPoolQuestionIds(poolResult.pool.id);

  if (questionIds.length !== INTERVIEW_POOL_SIZE) {
    return {
      status: "failed",
      reason: `pool ${poolResult.pool.id} has ${questionIds.length} questions, expected ${INTERVIEW_POOL_SIZE}`,
    };
  }

  const assignments = await buildCycleAssignments({
    userId: input.userId,
    poolId: poolResult.pool.id,
    questionIds,
  });

  const { created, cycle } = await createCycleWithAssignments({
    userId: input.userId,
    poolId: poolResult.pool.id,
    weekStart,
    assignments,
  });

  if (created) {
    recordInterviewEvent("cycle_started", {
      userId: input.userId,
      cycleId: cycle.id,
      poolId: poolResult.pool.id,
      poolVersion: poolResult.pool.poolVersion,
      weekStart: weekStart.toISOString(),
      poolReused: poolResult.reused,
    });
  }

  return { status: "ready", cycle, created };
}

export type InterviewCycleView =
  | {
      status: "ready";
      cycle: UserInterviewCycle;
      created: boolean;
      dayIndex: number;
      available: CycleQuestionRow[];
      locked: CycleQuestionRow[];
      totalQuestions: number;
    }
  | PoolNotReady;

export async function getInterviewCycleView(input: {
  userId: string;
  now?: Date;
}): Promise<InterviewCycleView> {
  const result = await getOrCreateInterviewCycle(input);

  if (result.status !== "ready") {
    return result;
  }

  const now = input.now ?? new Date();
  const dayIndex = getCycleDayIndex(result.cycle.weekStart, now);
  const questions = await listCycleQuestions({
    userId: input.userId,
    cycleId: result.cycle.id,
  });

  const isUnlocked = (row: CycleQuestionRow) =>
    row.bucket === "PRACTICE" || (row.dayIndex ?? Number.MAX_SAFE_INTEGER) <= dayIndex;

  return {
    status: "ready",
    cycle: result.cycle,
    created: result.created,
    dayIndex,
    available: questions.filter(isUnlocked),
    locked: questions.filter((row) => !isUnlocked(row)),
    totalQuestions: questions.length,
  };
}
