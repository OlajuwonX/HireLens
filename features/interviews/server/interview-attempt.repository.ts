import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  interviewAttempts,
  interviewQuestions,
  userInterviewQuestions,
  type InterviewDifficulty,
} from "@/lib/db/schema";

function isUniqueViolation(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export { isUniqueViolation };

export type CycleAssignmentRow = {
  questionId: string;
  bucket: "DAILY" | "PRACTICE";
  dayIndex: number | null;
  options: unknown;
  correctOption: number;
  explanation: string;
  difficulty: InterviewDifficulty;
};

export async function findCycleAssignmentByQuestionPublicId(input: {
  userId: string;
  cycleId: string;
  questionPublicId: string;
}): Promise<CycleAssignmentRow | null> {
  const [row] = await db
    .select({
      questionId: interviewQuestions.id,
      bucket: userInterviewQuestions.bucket,
      dayIndex: userInterviewQuestions.dayIndex,
      options: interviewQuestions.options,
      correctOption: interviewQuestions.correctOption,
      explanation: interviewQuestions.explanation,
      difficulty: interviewQuestions.difficulty,
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
        eq(interviewQuestions.publicId, input.questionPublicId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function insertAttempt(input: {
  userId: string;
  cycleId: string;
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  difficulty: InterviewDifficulty;
}) {
  const [attempt] = await db
    .insert(interviewAttempts)
    .values({
      userId: input.userId,
      cycleId: input.cycleId,
      questionId: input.questionId,
      selectedOption: input.selectedOption,
      isCorrect: input.isCorrect,
      difficulty: input.difficulty,
    })
    .returning();

  return attempt;
}

export type CycleAttemptRow = {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  difficulty: InterviewDifficulty;
  answeredAt: Date;
};

export async function listCycleAttempts(input: {
  userId: string;
  cycleId: string;
}): Promise<CycleAttemptRow[]> {
  return db
    .select({
      questionId: interviewAttempts.questionId,
      selectedOption: interviewAttempts.selectedOption,
      isCorrect: interviewAttempts.isCorrect,
      difficulty: interviewAttempts.difficulty,
      answeredAt: interviewAttempts.answeredAt,
    })
    .from(interviewAttempts)
    .where(
      and(
        eq(interviewAttempts.userId, input.userId),
        eq(interviewAttempts.cycleId, input.cycleId),
      ),
    );
}
