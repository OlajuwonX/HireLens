import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";
import { ANSWER_LIMITS } from "../constants";

export const answerSchema = z.object({
  publicId: z.preprocess(blankToUndefined, z.uuid().optional()),
  question: z
    .string()
    .trim()
    .min(5, "Write the question as an employer would ask it")
    .max(ANSWER_LIMITS.question, "Keep the question shorter"),
  answer: z
    .string()
    .trim()
    .min(1, "Add your answer")
    .max(ANSWER_LIMITS.answer, "Keep the answer under 4,000 characters"),
});

export const deleteAnswerSchema = z.object({
  publicId: z.uuid(),
});

export type AnswerInput = z.infer<typeof answerSchema>;

export function questionKey(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
