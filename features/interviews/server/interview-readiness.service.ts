import "server-only";

import { notifyUser } from "@/features/notifications/server/notification.service";
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

function formatWeekOf(weekStart: Date) {
  return weekStart.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

async function sendWeeklySummaryNotification(input: {
  userId: string;
  weekStart: Date;
  readiness: number;
  attempted: number;
  correct: number;
  total: number;
}) {
  const body =
    input.attempted === 0
      ? `You didn't answer any questions the week of ${formatWeekOf(input.weekStart)}. A fresh set is ready — two unlock each day.`
      : `Week of ${formatWeekOf(input.weekStart)}: ${input.attempted} of ${input.total} answered, ${input.correct} correct. A fresh set is ready.`;

  await notifyUser({
    userId: input.userId,
    kind: "SYSTEM",
    title: `Interview week complete — ${input.readiness}% ready`,
    body,
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
    const [assigned, attempts] = await Promise.all([
      countCycleQuestionsByDifficulty(cycle.id),
      listCycleAttempts({ userId: input.userId, cycleId: cycle.id }),
    ]);

    const { readiness } = computeReadiness({
      assigned,
      attempts: attempts.map((attempt) => ({
        difficulty: attempt.difficulty,
        isCorrect: attempt.isCorrect,
      })),
    });

    const closed = await closeCycle({
      cycleId: cycle.id,
      readinessScore: readiness,
      closedAt: input.now,
    });

    if (closed) {
      await sendWeeklySummaryNotification({
        userId: input.userId,
        weekStart: cycle.weekStart,
        readiness,
        attempted: attempts.length,
        correct: attempts.filter((attempt) => attempt.isCorrect).length,
        total: assigned.reduce((sum, row) => sum + row.count, 0),
      });
    }
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
