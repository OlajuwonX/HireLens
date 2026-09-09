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

const IDENTIFIABLE_CONTENT_PATTERNS: RegExp[] = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /\bhttps?:\/\/\S+/i,
  /\bwww\.[a-z0-9-]+\.[a-z]{2,}/i,
  /\b(?:linkedin\.com|github\.com|twitter\.com|x\.com|gitlab\.com)\/[a-z0-9_-]+/i,
  /(^|\s)@[a-z0-9_]{2,}\b/i,
  /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
];

export function containsIdentifiableContent(value: string): boolean {
  return IDENTIFIABLE_CONTENT_PATTERNS.some((pattern) => pattern.test(value));
}

export function scrubIdentifiableContent(value: string): string {
  return IDENTIFIABLE_CONTENT_PATTERNS.reduce(
    (text, pattern) =>
      text.replace(new RegExp(pattern.source, `${pattern.flags}g`), " "),
    value,
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function assertGeneralizedInterviewPool(pool: GeneratedInterviewPool) {
  for (const question of pool.questions) {
    const parts = [question.question, question.explanation, ...question.options];

    if (parts.some(containsIdentifiableContent)) {
      throw new Error(
        "interview pool contains identifiable or contact information",
      );
    }
  }
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
