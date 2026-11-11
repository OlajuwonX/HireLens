import "server-only";

import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { candidateAnswers } from "@/lib/db/schema";

const answerRow = {
  publicId: candidateAnswers.publicId,
  question: candidateAnswers.question,
  answer: candidateAnswers.answer,
  updatedAt: candidateAnswers.updatedAt,
};

export type AnswerRow = {
  publicId: string;
  question: string;
  answer: string;
  updatedAt: Date;
};

export async function listAnswers(userId: string): Promise<AnswerRow[]> {
  return db
    .select(answerRow)
    .from(candidateAnswers)
    .where(eq(candidateAnswers.userId, userId))
    .orderBy(desc(candidateAnswers.updatedAt));
}

export async function countAnswers(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(candidateAnswers)
    .where(eq(candidateAnswers.userId, userId));

  return row?.value ?? 0;
}

export async function upsertAnswer(input: {
  userId: string;
  questionKey: string;
  question: string;
  answer: string;
}) {
  const [row] = await db
    .insert(candidateAnswers)
    .values(input)
    .onConflictDoUpdate({
      target: [candidateAnswers.userId, candidateAnswers.questionKey],
      set: { question: input.question, answer: input.answer, updatedAt: new Date() },
    })
    .returning(answerRow);

  return row;
}

export async function deleteAnswer(input: { userId: string; publicId: string }) {
  const deleted = await db
    .delete(candidateAnswers)
    .where(
      and(
        eq(candidateAnswers.userId, input.userId),
        eq(candidateAnswers.publicId, input.publicId),
      ),
    )
    .returning({ publicId: candidateAnswers.publicId });

  return deleted.length > 0;
}

export async function findAnswerIdByKey(input: {
  userId: string;
  questionKey: string;
}) {
  const [row] = await db
    .select({ publicId: candidateAnswers.publicId })
    .from(candidateAnswers)
    .where(
      and(
        eq(candidateAnswers.userId, input.userId),
        eq(candidateAnswers.questionKey, input.questionKey),
      ),
    )
    .limit(1);

  return row?.publicId ?? null;
}

export async function updateAnswer(input: {
  userId: string;
  publicId: string;
  questionKey: string;
  question: string;
  answer: string;
}) {
  const updated = await db
    .update(candidateAnswers)
    .set({
      questionKey: input.questionKey,
      question: input.question,
      answer: input.answer,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(candidateAnswers.userId, input.userId),
        eq(candidateAnswers.publicId, input.publicId),
      ),
    )
    .returning({ publicId: candidateAnswers.publicId });

  return updated.length > 0;
}
