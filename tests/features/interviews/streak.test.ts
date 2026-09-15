import { describe, expect, it } from "vitest";
import {
  computeStreak,
  type DailyAssignmentRow,
} from "@/features/interviews/streak";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(now: Date, offset: number): Date {
  return new Date(now.getTime() - offset * DAY_MS);
}

function weekStartFor(date: Date): Date {
  const utcMidnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const dayOfWeek = new Date(utcMidnight).getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  return new Date(utcMidnight - daysSinceMonday * DAY_MS);
}

function completedDay(
  now: Date,
  offset: number,
  overrides: { answered?: number; assigned?: number } = {},
): DailyAssignmentRow[] {
  const date = daysAgo(now, offset);
  const weekStart = weekStartFor(date);
  const dayIndex =
    Math.round((date.getTime() - weekStart.getTime()) / DAY_MS) + 1;
  const assigned = overrides.assigned ?? 2;
  const answered = overrides.answered ?? assigned;

  return Array.from({ length: assigned }, (_, i) => ({
    weekStart,
    dayIndex,
    questionId: `q-${offset}-${i}`,
    answered: i < answered,
  }));
}

const NOW = new Date("2026-09-15T09:00:00Z"); // a Tuesday

describe("computeStreak", () => {
  it("is all zero with no activity", () => {
    expect(computeStreak({ rows: [], now: NOW })).toEqual({
      current: 0,
      longest: 0,
      todayComplete: false,
    });
  });

  it("counts a run of consecutive complete days ending today", () => {
    const rows = [0, 1, 2, 3, 4].flatMap((offset) =>
      completedDay(NOW, offset),
    );

    expect(computeStreak({ rows, now: NOW })).toEqual({
      current: 5,
      longest: 5,
      todayComplete: true,
    });
  });

  it("does not zero the streak just because today isn't done yet", () => {
    const rows = [1, 2, 3].flatMap((offset) => completedDay(NOW, offset));

    expect(computeStreak({ rows, now: NOW })).toEqual({
      current: 3,
      longest: 3,
      todayComplete: false,
    });
  });

  it("a gap breaks the current streak but keeps the longest one on record", () => {
    const recent = [0, 1].flatMap((offset) => completedDay(NOW, offset));
    const older = [5, 6, 7, 8, 9].flatMap((offset) =>
      completedDay(NOW, offset),
    );

    expect(computeStreak({ rows: [...recent, ...older], now: NOW })).toEqual({
      current: 2,
      longest: 5,
      todayComplete: true,
    });
  });

  it("a day with only some questions answered does not count as complete", () => {
    const rows = [
      ...completedDay(NOW, 0),
      ...completedDay(NOW, 1, { answered: 1 }),
      ...completedDay(NOW, 2),
    ];

    expect(computeStreak({ rows, now: NOW })).toEqual({
      current: 1,
      longest: 1,
      todayComplete: true,
    });
  });

  it("treats the day after a cycle's last day as consecutive with the next cycle's first day", () => {
    const rows = [0, 1, 2].flatMap((offset) => completedDay(NOW, offset));

    expect(
      new Set(rows.map((row) => row.weekStart.toISOString())).size,
    ).toBeGreaterThan(1);
    expect(computeStreak({ rows, now: NOW }).current).toBe(3);
  });
});
