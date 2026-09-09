import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  interviewQuestions,
  userInterviewCycles,
  userInterviewQuestions,
  type UserInterviewCycle,
} from "@/lib/db/schema";
import type { CycleAssignment } from "../cycle-assignment";

function isUniqueViolation(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function findCycleForWeek(input: {
  userId: string;
  weekStart: Date;
}) {
  const [cycle] = await db
    .select()
    .from(userInterviewCycles)
    .where(
      and(
        eq(userInterviewCycles.userId, input.userId),
        eq(userInterviewCycles.weekStart, input.weekStart),
      ),
    )
    .limit(1);

  return cycle ?? null;
}

export async function listPoolQuestionIds(poolId: string) {
  const rows = await db
    .select({ id: interviewQuestions.id })
    .from(interviewQuestions)
    .where(eq(interviewQuestions.poolId, poolId))
    .orderBy(asc(interviewQuestions.orderIndex));

  return rows.map((row) => row.id);
}

export async function createCycleWithAssignments(input: {
  userId: string;
  poolId: string;
  weekStart: Date;
  assignments: CycleAssignment[];
}): Promise<{ created: boolean; cycle: UserInterviewCycle }> {
  try {
    return await db.transaction(async (tx) => {
      const [cycle] = await tx
        .insert(userInterviewCycles)
        .values({
          userId: input.userId,
          poolId: input.poolId,
          weekStart: input.weekStart,
        })
        .returning();

      await tx.insert(userInterviewQuestions).values(
        input.assignments.map((assignment) => ({
          userId: input.userId,
          cycleId: cycle.id,
          questionId: assignment.questionId,
          bucket: assignment.bucket,
          dayIndex: assignment.dayIndex,
          assignedOrder: assignment.assignedOrder,
        })),
      );

      return { created: true, cycle };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await findCycleForWeek({
        userId: input.userId,
        weekStart: input.weekStart,
      });

      if (existing) {
        return { created: false, cycle: existing };
      }
    }

    throw error;
  }
}

export type CycleQuestionRow = {
  assignmentId: string;
  questionPublicId: string;
  bucket: "DAILY" | "PRACTICE";
  dayIndex: number | null;
  assignedOrder: number;
  question: string;
  options: unknown;
  difficulty: string;
  topic: string;
};

export async function listCycleQuestions(input: {
  userId: string;
  cycleId: string;
}): Promise<CycleQuestionRow[]> {
  return db
    .select({
      assignmentId: userInterviewQuestions.id,
      questionPublicId: interviewQuestions.publicId,
      bucket: userInterviewQuestions.bucket,
      dayIndex: userInterviewQuestions.dayIndex,
      assignedOrder: userInterviewQuestions.assignedOrder,
      question: interviewQuestions.question,
      options: interviewQuestions.options,
      difficulty: interviewQuestions.difficulty,
      topic: interviewQuestions.topic,
    })
    .from(userInterviewQuestions)
    .innerJoin(
      interviewQuestions,
      eq(interviewQuestions.id, userInterviewQuestions.questionId),
    )
    .where(
      and(
        eq(userInterviewQuestions.userId, input.userId),
        eq(userInterviewQuestions.cycleId, input.cycleId),
      ),
    )
    .orderBy(asc(userInterviewQuestions.assignedOrder));
}
