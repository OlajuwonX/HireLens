import "server-only";

import type { GeneratedInterviewQuestion } from "@/lib/ai";
import { db } from "@/lib/db/client";
import { interviewQuestions, type InterviewDifficulty } from "@/lib/db/schema";

const DIFFICULTY_MAP: Record<
  GeneratedInterviewQuestion["difficulty"],
  InterviewDifficulty
> = {
  easy: "EASY",
  challenging: "CHALLENGING",
  hard: "HARD",
  very_hard: "VERY_HARD",
};

export async function insertPoolQuestions(input: {
  poolId: string;
  questions: GeneratedInterviewQuestion[];
}) {
  const rows = input.questions.map((question, index) => ({
    poolId: input.poolId,
    orderIndex: index,
    question: question.question,
    options: question.options,
    correctOption: question.correctOption,
    explanation: question.explanation,
    difficulty: DIFFICULTY_MAP[question.difficulty],
    topic: question.topic,
  }));

  return db
    .insert(interviewQuestions)
    .values(rows)
    .returning({ id: interviewQuestions.id });
}
