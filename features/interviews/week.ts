import { INTERVIEW_CYCLE_DAYS } from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getWeekStart(date: Date): Date {
  const utcMidnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const dayOfWeek = new Date(utcMidnight).getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  return new Date(utcMidnight - daysSinceMonday * DAY_MS);
}

export function getCycleDayIndex(weekStart: Date, now: Date): number {
  const elapsed = now.getTime() - weekStart.getTime();

  if (elapsed < 0) {
    return 1;
  }

  const day = Math.floor(elapsed / DAY_MS) + 1;

  return Math.min(Math.max(day, 1), INTERVIEW_CYCLE_DAYS);
}
