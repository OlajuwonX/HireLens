import { z } from "zod";

export const INTERVIEW_POOL_QUESTION_COUNT = 30;

export const generatedDifficultyValues = [
  "easy",
  "challenging",
  "hard",
  "very_hard",
] as const;

export type GeneratedDifficulty = (typeof generatedDifficultyValues)[number];

export const REQUIRED_DIFFICULTY_DISTRIBUTION: Record<
  GeneratedDifficulty,
  number
> = {
  easy: 6,
  challenging: 8,
  hard: 10,
  very_hard: 6,
};

export const generatedInterviewQuestionSchema = z.object({
  question: z.string().min(12).max(600),
  options: z.array(z.string().min(1).max(400)).min(4).max(4),
  correctOption: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(1200),
  difficulty: z.enum(generatedDifficultyValues),
  topic: z.string().min(2).max(80),
});

export type GeneratedInterviewQuestion = z.infer<
  typeof generatedInterviewQuestionSchema
>;

export const generatedInterviewPoolSchema = z.object({
  questions: z
    .array(generatedInterviewQuestionSchema)
    .min(INTERVIEW_POOL_QUESTION_COUNT)
    .max(INTERVIEW_POOL_QUESTION_COUNT),
});

export type GeneratedInterviewPool = z.infer<
  typeof generatedInterviewPoolSchema
>;

function normalizeQuestion(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function assertValidInterviewPool(pool: GeneratedInterviewPool) {
  const counts: Record<GeneratedDifficulty, number> = {
    easy: 0,
    challenging: 0,
    hard: 0,
    very_hard: 0,
  };
  const seen = new Set<string>();

  for (const question of pool.questions) {
    counts[question.difficulty] += 1;

    const key = normalizeQuestion(question.question);

    if (seen.has(key)) {
      throw new Error("interview pool contains duplicate questions");
    }

    seen.add(key);
  }

  for (const difficulty of generatedDifficultyValues) {
    if (counts[difficulty] !== REQUIRED_DIFFICULTY_DISTRIBUTION[difficulty]) {
      throw new Error(
        `interview pool difficulty distribution is wrong: expected ${REQUIRED_DIFFICULTY_DISTRIBUTION[difficulty]} ${difficulty}, received ${counts[difficulty]}`,
      );
    }
  }
}
