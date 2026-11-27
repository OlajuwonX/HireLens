const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export const DISPLAY_TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE || "UTC";

function parts(date: Date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: DISPLAY_TIME_ZONE,
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  ) as Record<"year" | "month" | "day" | "weekday" | "hour" | "minute", string>;
}

function dayNumber(date: Date) {
  const value = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: DISPLAY_TIME_ZONE, year: "numeric", month: "numeric", day: "numeric" })
      .formatToParts(date)
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<"year" | "month" | "day", number>;

  return Date.UTC(value.year, value.month - 1, value.day) / DAY;
}

export function formatDate(date: Date, now = new Date()) {
  const value = parts(date);

  return value.year === parts(now).year ? `${value.day} ${value.month}` : `${value.day} ${value.month} ${value.year}`;
}

export function formatTime(date: Date) {
  const value = parts(date);

  return `${value.hour}:${value.minute}`;
}

export function formatDateTime(date: Date, now = new Date()) {
  return `${formatDate(date, now)}, ${formatTime(date)}`;
}

export function daysBetween(date: Date, now = new Date()) {
  return Math.round(dayNumber(date) - dayNumber(now));
}

export function formatDay(date: Date, now = new Date()) {
  const days = daysBetween(date, now);

  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (Math.abs(days) < 7) return `${days > 0 ? "" : "last "}${new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: DISPLAY_TIME_ZONE }).format(date)}`;

  return formatDate(date, now);
}

export function formatWhen(date: Date, now = new Date()) {
  const elapsed = now.getTime() - date.getTime();

  if (elapsed < 0 || elapsed >= WEEK) return formatDate(date, now);
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} min ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)} h ago`;

  return daysBetween(date, now) === -1 ? "yesterday" : `${parts(date).weekday} ${formatTime(date)}`;
}
