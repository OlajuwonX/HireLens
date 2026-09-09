import "server-only";

import type { InterviewDifficulty } from "@/lib/db/schema";
import { computeReadiness } from "../readiness";
import { getCycleDayIndex, getWeekStart } from "../week";
import { getInterviewEligibility } from "./interview-eligibility.service";
import { listCycleAttempts } from "./interview-attempt.repository";
import { findCycleForWeek } from "./interview-cycle.repository";
import { listCycleAssignmentSummary } from "./interview-dashboard.repository";

export type DashboardInterview =
  | { state: "prerequisites"; hasResume: boolean; hasJobContext: boolean }
  | { state: "ready_to_start" }
  | { state: "unavailable" }
  | {
      state: "active";
      readiness: number;
      total: number;
      attempted: number;
      correct: number;
      incorrect: number;
      remaining: number;
      dayIndex: number;
      dailyDueToday: number;
      dailyAnsweredToday: number;
      completed: boolean;
    };

export async function getDashboardInterview(
  userId: string,
  now: Date = new Date(),
): Promise<DashboardInterview> {
  try {
    return await readDashboardInterview(userId, now);
  } catch (error) {
    console.error("dashboard interview read failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });

    return { state: "unavailable" };
  }
}

async function readDashboardInterview(
  userId: string,
  now: Date,
): Promise<DashboardInterview> {
  const eligibility = await getInterviewEligibility(userId);

  if (!eligibility.eligible) {
    return {
      state: "prerequisites",
      hasResume: eligibility.hasResume,
      hasJobContext: eligibility.hasJobContext,
    };
  }

  const cycle = await findCycleForWeek({
    userId,
    weekStart: getWeekStart(now),
  });

  if (!cycle) {
    return { state: "ready_to_start" };
  }

  const [assignments, attempts] = await Promise.all([
    listCycleAssignmentSummary(cycle.id),
    listCycleAttempts({ userId, cycleId: cycle.id }),
  ]);

  const dayIndex = getCycleDayIndex(cycle.weekStart, now);
  const answeredIds = new Set(attempts.map((attempt) => attempt.questionId));
  const assignedByDifficulty = new Map<InterviewDifficulty, number>();

  for (const assignment of assignments) {
    assignedByDifficulty.set(
      assignment.difficulty,
      (assignedByDifficulty.get(assignment.difficulty) ?? 0) + 1,
    );
  }

  const { readiness } = computeReadiness({
    assigned: [...assignedByDifficulty].map(([difficulty, count]) => ({
      difficulty,
      count,
    })),
    attempts: attempts.map((attempt) => ({
      difficulty: attempt.difficulty,
      isCorrect: attempt.isCorrect,
    })),
  });

  const todaysDaily = assignments.filter(
    (assignment) =>
      assignment.bucket === "DAILY" && assignment.dayIndex === dayIndex,
  );
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const total = assignments.length;
  const attempted = attempts.length;

  return {
    state: "active",
    readiness,
    total,
    attempted,
    correct,
    incorrect: attempted - correct,
    remaining: Math.max(0, total - attempted),
    dayIndex,
    dailyDueToday: todaysDaily.length,
    dailyAnsweredToday: todaysDaily.filter((assignment) =>
      answeredIds.has(assignment.questionId),
    ).length,
    completed: total > 0 && attempted >= total,
  };
}
