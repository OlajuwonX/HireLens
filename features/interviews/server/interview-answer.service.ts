import "server-only";

import { getCycleDayIndex, getWeekStart } from "../week";
import { findCycleForWeek } from "./interview-cycle.repository";
import {
  findCycleAssignmentByQuestionPublicId,
  insertAttempt,
  isUniqueViolation,
  listCycleAttempts,
} from "./interview-attempt.repository";

export type SubmitAnswerError =
  | "NO_CYCLE"
  | "FORGED_QUESTION"
  | "LOCKED"
  | "INVALID_OPTION"
  | "ALREADY_ANSWERED";

export type SubmitAnswerOutcome =
  | {
      ok: true;
      questionPublicId: string;
      selectedOption: number;
      correct: boolean;
      correctOption: number;
      explanation: string;
    }
  | { ok: false; error: SubmitAnswerError };

export async function submitInterviewAnswer(input: {
  userId: string;
  questionPublicId: string;
  selectedOption: number;
  now?: Date;
}): Promise<SubmitAnswerOutcome> {
  const now = input.now ?? new Date();
  const cycle = await findCycleForWeek({
    userId: input.userId,
    weekStart: getWeekStart(now),
  });

  if (!cycle) {
    return { ok: false, error: "NO_CYCLE" };
  }

  const assignment = await findCycleAssignmentByQuestionPublicId({
    userId: input.userId,
    cycleId: cycle.id,
    questionPublicId: input.questionPublicId,
  });

  if (!assignment) {
    return { ok: false, error: "FORGED_QUESTION" };
  }

  if (
    assignment.bucket === "DAILY" &&
    (assignment.dayIndex ?? Number.MAX_SAFE_INTEGER) >
      getCycleDayIndex(cycle.weekStart, now)
  ) {
    return { ok: false, error: "LOCKED" };
  }

  const options = Array.isArray(assignment.options) ? assignment.options : [];

  if (
    !Number.isInteger(input.selectedOption) ||
    input.selectedOption < 0 ||
    input.selectedOption >= options.length
  ) {
    return { ok: false, error: "INVALID_OPTION" };
  }

  const correct = input.selectedOption === assignment.correctOption;

  try {
    await insertAttempt({
      userId: input.userId,
      cycleId: cycle.id,
      questionId: assignment.questionId,
      selectedOption: input.selectedOption,
      isCorrect: correct,
      difficulty: assignment.difficulty,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "ALREADY_ANSWERED" };
    }

    throw error;
  }

  return {
    ok: true,
    questionPublicId: input.questionPublicId,
    selectedOption: input.selectedOption,
    correct,
    correctOption: assignment.correctOption,
    explanation: assignment.explanation,
  };
}

export type CycleAttemptSummary = {
  attempted: number;
  correct: number;
  incorrect: number;
};

export async function getCycleAttemptSummary(input: {
  userId: string;
  cycleId: string;
}): Promise<CycleAttemptSummary> {
  const attempts = await listCycleAttempts(input);
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;

  return {
    attempted: attempts.length,
    correct,
    incorrect: attempts.length - correct,
  };
}
