import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  interviewAttempts,
  interviewQuestions,
  userInterviewQuestions,
  type InterviewDifficulty,
} from "@/lib/db/schema";

export type CyclePageQuestionRow = {
  questionPublicId: string;
  question: string;
  options: unknown;
  difficulty: InterviewDifficulty;
  topic: string;
  bucket: "DAILY" | "PRACTICE";
  dayIndex: number | null;
  assignedOrder: number;
  selectedOption: number | null;
  isCorrect: boolean | null;
  correctOption: number;
  explanation: string;
};

export async function listCyclePageQuestions(input: {
  userId: string;
  cycleId: string;
}): Promise<CyclePageQuestionRow[]> {
  return db
    .select({
      questionPublicId: interviewQuestions.publicId,
      question: interviewQuestions.question,
      options: interviewQuestions.options,
      difficulty: interviewQuestions.difficulty,
      topic: interviewQuestions.topic,
      bucket: userInterviewQuestions.bucket,
      dayIndex: userInterviewQuestions.dayIndex,
      assignedOrder: userInterviewQuestions.assignedOrder,
      selectedOption: interviewAttempts.selectedOption,
      isCorrect: interviewAttempts.isCorrect,
      correctOption: interviewQuestions.correctOption,
      explanation: interviewQuestions.explanation,
    })
    .from(userInterviewQuestions)
    .innerJoin(
      interviewQuestions,
      eq(interviewQuestions.id, userInterviewQuestions.questionId),
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
        eq(userInterviewQuestions.userId, input.userId),
        eq(userInterviewQuestions.cycleId, input.cycleId),
      ),
    )
    .orderBy(asc(userInterviewQuestions.assignedOrder));
}
