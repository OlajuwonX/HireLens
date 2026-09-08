import type { InterviewDifficulty } from "@/lib/db/schema";
import { INTERVIEW_DIFFICULTY_WEIGHTS } from "./constants";

export type DifficultyCount = {
  difficulty: InterviewDifficulty;
  count: number;
};

export type ReadinessAttempt = {
  difficulty: InterviewDifficulty;
  isCorrect: boolean;
};

export type Readiness = {
  readiness: number;
  earnedPoints: number;
  totalPoints: number;
};

export function computeReadiness(input: {
  assigned: DifficultyCount[];
  attempts: ReadinessAttempt[];
}): Readiness {
  const totalPoints = input.assigned.reduce(
    (sum, row) =>
      sum + row.count * INTERVIEW_DIFFICULTY_WEIGHTS[row.difficulty],
    0,
  );

  const earnedPoints = input.attempts.reduce(
    (sum, attempt) =>
      attempt.isCorrect
        ? sum + INTERVIEW_DIFFICULTY_WEIGHTS[attempt.difficulty]
        : sum,
    0,
  );

  const readiness =
    totalPoints > 0
      ? Math.min(100, Math.round((earnedPoints / totalPoints) * 100))
      : 0;

  return { readiness, earnedPoints, totalPoints };
}
