export const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type CalendarDay = {
  date: Date;
  iso: string;
  dayOfMonth: number;
  inMonth: boolean;
};

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function fromIsoDate(iso: string | null | undefined) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return null;
  }

  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) {
    return false;
  }

  return toIsoDate(a) === toIsoDate(b);
}

export function isBefore(a: Date, b: Date) {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

export function isWithin(date: Date, from: Date | null, to: Date | null) {
  if (!from || !to) {
    return false;
  }

  const time = startOfDay(date).getTime();

  return time > startOfDay(from).getTime() && time < startOfDay(to).getTime();
}

export function buildMonth(month: Date): CalendarDay[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);

  start.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);

    date.setDate(start.getDate() + index);

    return {
      date,
      iso: toIsoDate(date),
      dayOfMonth: date.getDate(),
      inMonth: date.getMonth() === month.getMonth(),
    };
  });
}

export function formatDisplayDate(iso: string | null | undefined) {
  const date = fromIsoDate(iso);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRangeLabel(from: string | null, to: string | null) {
  if (!from && !to) {
    return "";
  }

  if (from && to) {
    return `${formatDisplayDate(from)} - ${formatDisplayDate(to)}`;
  }

  return from
    ? `From ${formatDisplayDate(from)}`
    : `Until ${formatDisplayDate(to)}`;
}
