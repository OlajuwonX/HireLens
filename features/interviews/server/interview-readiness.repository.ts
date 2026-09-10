import "server-only";

import { and, asc, count, eq, isNotNull, isNull, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  interviewQuestions,
  userInterviewCycles,
  userInterviewQuestions,
  type InterviewDifficulty,
} from "@/lib/db/schema";

export async function countCycleQuestionsByDifficulty(cycleId: string) {
  const rows = await db
    .select({
      difficulty: interviewQuestions.difficulty,
      value: count(),
    })
    .from(userInterviewQuestions)
    .innerJoin(
      interviewQuestions,
      eq(interviewQuestions.id, userInterviewQuestions.questionId),
    )
    .where(eq(userInterviewQuestions.cycleId, cycleId))
    .groupBy(interviewQuestions.difficulty);

  return rows.map((row) => ({
    difficulty: row.difficulty as InterviewDifficulty,
    count: Number(row.value),
  }));
}

export async function listStaleOpenCycles(input: {
  userId: string;
  currentWeekStart: Date;
}) {
  return db
    .select({
      id: userInterviewCycles.id,
      weekStart: userInterviewCycles.weekStart,
    })
    .from(userInterviewCycles)
    .where(
      and(
        eq(userInterviewCycles.userId, input.userId),
        isNull(userInterviewCycles.closedAt),
        lt(userInterviewCycles.weekStart, input.currentWeekStart),
      ),
    );
}

export async function closeCycle(input: {
  cycleId: string;
  readinessScore: number;
  closedAt: Date;
}): Promise<boolean> {
  const closed = await db
    .update(userInterviewCycles)
    .set({
      closedAt: input.closedAt,
      readinessScore: input.readinessScore,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userInterviewCycles.id, input.cycleId),
        isNull(userInterviewCycles.closedAt),
      ),
    )
    .returning({ id: userInterviewCycles.id });

  return closed.length > 0;
}

export async function listClosedCycles(userId: string) {
  return db
    .select({
      publicId: userInterviewCycles.publicId,
      weekStart: userInterviewCycles.weekStart,
      readinessScore: userInterviewCycles.readinessScore,
    })
    .from(userInterviewCycles)
    .where(
      and(
        eq(userInterviewCycles.userId, userId),
        isNotNull(userInterviewCycles.closedAt),
      ),
    )
    .orderBy(asc(userInterviewCycles.weekStart));
}
