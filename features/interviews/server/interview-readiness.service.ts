import "server-only";

import { computeReadiness, type Readiness } from "../readiness";
import { getWeekStart } from "../week";
import { listCycleAttempts } from "./interview-attempt.repository";
import {
  closeCycle,
  countCycleQuestionsByDifficulty,
  listClosedCycles,
  listStaleOpenCycles,
} from "./interview-readiness.repository";

export async function getCycleReadiness(input: {
  userId: string;
  cycleId: string;
}): Promise<Readiness> {
  const [assigned, attempts] = await Promise.all([
    countCycleQuestionsByDifficulty(input.cycleId),
    listCycleAttempts({ userId: input.userId, cycleId: input.cycleId }),
  ]);

  return computeReadiness({
    assigned,
    attempts: attempts.map((attempt) => ({
      difficulty: attempt.difficulty,
      isCorrect: attempt.isCorrect,
    })),
  });
}

export async function closeStaleCyclesForUser(input: {
  userId: string;
  now: Date;
}): Promise<number> {
  const stale = await listStaleOpenCycles({
    userId: input.userId,
    currentWeekStart: getWeekStart(input.now),
  });

  for (const cycle of stale) {
    const { readiness } = await getCycleReadiness({
      userId: input.userId,
      cycleId: cycle.id,
    });

    await closeCycle({
      cycleId: cycle.id,
      readinessScore: readiness,
      closedAt: input.now,
    });
  }

  return stale.length;
}

export type ReadinessHistoryPoint = {
  cyclePublicId: string;
  weekStart: Date;
  readiness: number;
};

export async function getReadinessHistory(
  userId: string,
): Promise<ReadinessHistoryPoint[]> {
  const closed = await listClosedCycles(userId);

  return closed.map((cycle) => ({
    cyclePublicId: cycle.publicId,
    weekStart: cycle.weekStart,
    readiness: cycle.readinessScore ?? 0,
  }));
}
