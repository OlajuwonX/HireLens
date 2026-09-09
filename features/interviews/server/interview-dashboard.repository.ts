import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  interviewQuestions,
  userInterviewQuestions,
  type InterviewDifficulty,
} from "@/lib/db/schema";

export type CycleAssignmentSummaryRow = {
  questionId: string;
  bucket: "DAILY" | "PRACTICE";
  dayIndex: number | null;
  difficulty: InterviewDifficulty;
};

export async function listCycleAssignmentSummary(
  cycleId: string,
): Promise<CycleAssignmentSummaryRow[]> {
  return db
    .select({
      questionId: userInterviewQuestions.questionId,
      bucket: userInterviewQuestions.bucket,
      dayIndex: userInterviewQuestions.dayIndex,
      difficulty: interviewQuestions.difficulty,
    })
    .from(userInterviewQuestions)
    .innerJoin(
      interviewQuestions,
      eq(interviewQuestions.id, userInterviewQuestions.questionId),
    )
    .where(eq(userInterviewQuestions.cycleId, cycleId));
}
