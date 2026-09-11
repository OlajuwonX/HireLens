import "server-only";

import { getCycleDayIndex, getWeekStart } from "../week";
import { findCycleForWeek } from "./interview-cycle.repository";
import { listCyclePageQuestions } from "./interview-page.repository";
import {
  toInterviewPageQuestion,
  type InterviewPageQuestion,
} from "./interview-page.service";

export type DailyInterviewPrompt =
  | { due: false }
  | {
      due: true;
      cyclePublicId: string;
      dayIndex: number;
      answeredToday: number;
      questions: InterviewPageQuestion[];
    };

export async function getDailyInterviewPrompt(
  userId: string,
  now: Date = new Date(),
): Promise<DailyInterviewPrompt> {
  try {
    const cycle = await findCycleForWeek({
      userId,
      weekStart: getWeekStart(now),
    });

    if (!cycle) {
      return { due: false };
    }

    const dayIndex = getCycleDayIndex(cycle.weekStart, now);
    const rows = await listCyclePageQuestions({ userId, cycleId: cycle.id });
    const questions = rows
      .filter((row) => row.bucket === "DAILY" && row.dayIndex === dayIndex)
      .map(toInterviewPageQuestion);

    if (questions.length === 0) {
      return { due: false };
    }

    return {
      due: true,
      cyclePublicId: cycle.publicId,
      dayIndex,
      answeredToday: questions.filter((question) => question.answered !== null)
        .length,
      questions,
    };
  } catch (error) {
    console.error("daily interview prompt read failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });

    return { due: false };
  }
}
