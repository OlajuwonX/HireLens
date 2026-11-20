import "server-only";

import { ANSWER_LIMITS } from "../constants";
import { questionKey, type AnswerInput } from "../schemas/answer.schema";
import {
  countAnswers,
  deleteAnswer,
  findAnswerIdByKey,
  updateAnswer,
  upsertAnswer,
} from "./answer.repository";

export type SaveAnswerResult =
  | { ok: true; updated: boolean }
  | { ok: false; message: string };

const fail = (message: string): SaveAnswerResult => ({ ok: false, message });

export async function saveAnswer(input: {
  userId: string;
  values: AnswerInput;
}): Promise<SaveAnswerResult> {
  const { publicId, question, answer } = input.values;
  const key = questionKey(question);

  if (!key) {
    return fail("Write the question with letters or numbers.");
  }

  const existingId = await findAnswerIdByKey({ userId: input.userId, questionKey: key });

  if (publicId) {
    if (existingId && existingId !== publicId) {
      return fail("You already have an answer to that question.");
    }

    const updated = await updateAnswer({
      userId: input.userId,
      publicId,
      questionKey: key,
      question,
      answer,
    });

    return updated ? { ok: true, updated: true } : fail("That answer no longer exists.");
  }

  if (!existingId && (await countAnswers(input.userId)) >= ANSWER_LIMITS.perUser) {
    return fail(`You can keep up to ${ANSWER_LIMITS.perUser} answers. Delete one first.`);
  }

  await upsertAnswer({ userId: input.userId, questionKey: key, question, answer });

  return { ok: true, updated: Boolean(existingId) };
}

export async function removeAnswer(input: { userId: string; publicId: string }) {
  return deleteAnswer(input);
}
