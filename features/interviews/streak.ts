const DAY_MS = 24 * 60 * 60 * 1000;

export type DailyAssignmentRow = {
  weekStart: Date;
  dayIndex: number;
  questionId: string;
  answered: boolean;
};

export type Streak = {
  current: number;
  longest: number;
  todayComplete: boolean;
};

function dayKey(weekStart: Date, dayIndex: number): number {
  return weekStart.getTime() + (dayIndex - 1) * DAY_MS;
}

function toUtcMidnight(date: Date): number {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
}

export function computeStreak(input: {
  rows: DailyAssignmentRow[];
  now: Date;
}): Streak {
  const byDay = new Map<number, { assigned: number; answered: number }>();

  for (const row of input.rows) {
    const key = dayKey(row.weekStart, row.dayIndex);
    const entry = byDay.get(key) ?? { assigned: 0, answered: 0 };

    entry.assigned += 1;
    if (row.answered) {
      entry.answered += 1;
    }

    byDay.set(key, entry);
  }

  const completeDays = new Set(
    [...byDay.entries()]
      .filter(
        ([, entry]) => entry.assigned > 0 && entry.answered >= entry.assigned,
      )
      .map(([key]) => key),
  );

  const today = toUtcMidnight(input.now);
  const todayComplete = completeDays.has(today);

  let current = 0;
  let cursor = todayComplete ? today : today - DAY_MS;

  while (completeDays.has(cursor)) {
    current += 1;
    cursor -= DAY_MS;
  }

  const sortedDays = [...completeDays].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let previous: number | null = null;

  for (const day of sortedDays) {
    run = previous !== null && day - previous === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }

  return { current, longest, todayComplete };
}
