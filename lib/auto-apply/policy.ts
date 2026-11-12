export const DEFAULT_DAILY_SUBMISSIONS = 30;

export function dailySubmissionLimit(raw = process.env.AUTO_APPLY_DAILY_LIMIT) {
  const parsed = Number.parseInt((raw ?? "").trim(), 10);

  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, DEFAULT_DAILY_SUBMISSIONS) : DEFAULT_DAILY_SUBMISSIONS;
}

export function submissionsRemaining(usedToday: number, limit = dailySubmissionLimit()) {
  return Math.max(0, limit - usedToday);
}

export function normalizeRole(company: string, title: string) {
  return [company, title]
    .map((part) => part.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
    .join("|");
}
