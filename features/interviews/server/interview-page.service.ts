import "server-only";

import type { InterviewDifficulty } from "@/lib/db/schema";
import { computeReadiness } from "../readiness";
import { getCycleDayIndex, getWeekStart } from "../week";
import { findCycleForWeek } from "./interview-cycle.repository";
import {
  listCyclePageQuestions,
  type CyclePageQuestionRow,
} from "./interview-page.repository";
import { closeStaleCyclesForUser } from "./interview-readiness.service";

export type InterviewPageQuestion = {
  questionPublicId: string;
  question: string;
  options: string[];
  difficulty: InterviewDifficulty;
  topic: string;
  answered: {
    selectedOption: number;
    correct: boolean;
    correctOption: number;
    explanation: string;
  } | null;
};

export type InterviewPageData =
  | { status: "none" }
  | {
      status: "ready";
      cyclePublicId: string;
      weekStartIso: string;
      dayIndex: number;
      readiness: number;
      progress: {
        attempted: number;
        correct: number;
        incorrect: number;
        total: number;
      };
      completed: boolean;
      dailyToday: InterviewPageQuestion[];
      dailyUpcoming: number;
      practice: InterviewPageQuestion[];
    };

function toOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.map((option) => String(option)) : [];
}

function toQuestion(row: CyclePageQuestionRow): InterviewPageQuestion {
  const isAnswered = row.selectedOption !== null && row.isCorrect !== null;

  return {
    questionPublicId: row.questionPublicId,
    question: row.question,
    options: toOptions(row.options),
    difficulty: row.difficulty,
    topic: row.topic,
    answered: isAnswered
      ? {
          selectedOption: row.selectedOption as number,
          correct: row.isCorrect as boolean,
          correctOption: row.correctOption,
          explanation: row.explanation,
        }
      : null,
  };
}

export async function getInterviewPageData(input: {
  userId: string;
  now?: Date;
}): Promise<InterviewPageData> {
  const now = input.now ?? new Date();

  await closeStaleCyclesForUser({ userId: input.userId, now });

  const cycle = await findCycleForWeek({
    userId: input.userId,
    weekStart: getWeekStart(now),
  });

  if (!cycle) {
    return { status: "none" };
  }

  const dayIndex = getCycleDayIndex(cycle.weekStart, now);
  const rows = await listCyclePageQuestions({
    userId: input.userId,
    cycleId: cycle.id,
  });

  const unlocked = (row: CyclePageQuestionRow) =>
    (row.dayIndex ?? Number.MAX_SAFE_INTEGER) <= dayIndex;

  const dailyToday = rows
    .filter((row) => row.bucket === "DAILY" && unlocked(row))
    .map(toQuestion);
  const dailyUpcoming = rows.filter(
    (row) => row.bucket === "DAILY" && !unlocked(row),
  ).length;
  const practice = rows
    .filter((row) => row.bucket === "PRACTICE")
    .map(toQuestion);

  const attempts = rows
    .filter((row) => row.selectedOption !== null && row.isCorrect !== null)
    .map((row) => ({
      difficulty: row.difficulty,
      isCorrect: row.isCorrect as boolean,
    }));

  const assignedByDifficulty = new Map<InterviewDifficulty, number>();

  for (const row of rows) {
    assignedByDifficulty.set(
      row.difficulty,
      (assignedByDifficulty.get(row.difficulty) ?? 0) + 1,
    );
  }

  const { readiness } = computeReadiness({
    assigned: [...assignedByDifficulty].map(([difficulty, count]) => ({
      difficulty,
      count,
    })),
    attempts,
  });

  const correct = attempts.filter((attempt) => attempt.isCorrect).length;

  return {
    status: "ready",
    cyclePublicId: cycle.publicId,
    weekStartIso: cycle.weekStart.toISOString(),
    dayIndex,
    readiness,
    progress: {
      attempted: attempts.length,
      correct,
      incorrect: attempts.length - correct,
      total: rows.length,
    },
    completed: rows.length > 0 && attempts.length >= rows.length,
    dailyToday,
    dailyUpcoming,
    practice,
  };
}
