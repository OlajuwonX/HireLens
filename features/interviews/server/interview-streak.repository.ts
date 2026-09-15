import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  interviewAttempts,
  userInterviewCycles,
  userInterviewQuestions,
} from "@/lib/db/schema";
import type { DailyAssignmentRow } from "../streak";

export async function listDailyAssignmentActivity(
  userId: string,
): Promise<DailyAssignmentRow[]> {
  const rows = await db
    .select({
      weekStart: userInterviewCycles.weekStart,
      dayIndex: userInterviewQuestions.dayIndex,
      questionId: userInterviewQuestions.questionId,
      answeredAt: interviewAttempts.answeredAt,
    })
    .from(userInterviewQuestions)
    .innerJoin(
      userInterviewCycles,
      eq(userInterviewCycles.id, userInterviewQuestions.cycleId),
    )
    .leftJoin(
      interviewAttempts,
      and(
        eq(interviewAttempts.questionId, userInterviewQuestions.questionId),
        eq(interviewAttempts.cycleId, userInterviewQuestions.cycleId),
        eq(interviewAttempts.userId, userInterviewQuestions.userId),
      ),
    )
    .where(
      and(
        eq(userInterviewQuestions.userId, userId),
        eq(userInterviewQuestions.bucket, "DAILY"),
      ),
    )
    .orderBy(
      asc(userInterviewCycles.weekStart),
      asc(userInterviewQuestions.dayIndex),
    );

  return rows.map((row) => ({
    weekStart: row.weekStart,
    dayIndex: row.dayIndex as number,
    questionId: row.questionId,
    answered: row.answeredAt !== null,
  }));
}
