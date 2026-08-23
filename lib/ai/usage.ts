export const AI_BURST_LIMIT = 3;
export const AI_BURST_WINDOW_SECONDS = 60;
export const AI_RESERVATION_TTL_SECONDS = 180;

export const AI_USAGE_ACTIONS = [
  "APPLICATION_ANALYSIS",
  "APPLICATION_REGENERATE",
  "JOB_EXTRACTION",
] as const;

export type AiUsageAction = (typeof AI_USAGE_ACTIONS)[number];

export const usageActionLabels: Record<AiUsageAction, string> = {
  APPLICATION_ANALYSIS: "Application analyses",
  APPLICATION_REGENERATE: "Regenerated analyses",
  JOB_EXTRACTION: "Job posting imports",
};

export const AI_USAGE_DEFAULTS = {
  AI_DAILY_APPLICATION_ANALYSIS_LIMIT: 4,
  AI_DAILY_REGENERATE_LIMIT: 1,
  AI_DAILY_JOB_EXTRACTION_LIMIT: 3,
  AI_GLOBAL_DAILY_SAFETY_LIMIT: 40,
} as const;

function readLimit(key: keyof typeof AI_USAGE_DEFAULTS) {
  const parsed = Number.parseInt(process.env[key] ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : AI_USAGE_DEFAULTS[key];
}

export function getDailyAllowance(action: AiUsageAction) {
  if (action === "APPLICATION_REGENERATE") {
    return readLimit("AI_DAILY_REGENERATE_LIMIT");
  }

  if (action === "JOB_EXTRACTION") {
    return readLimit("AI_DAILY_JOB_EXTRACTION_LIMIT");
  }

  return readLimit("AI_DAILY_APPLICATION_ANALYSIS_LIMIT");
}

export function getGlobalDailySafetyLimit() {
  return readLimit("AI_GLOBAL_DAILY_SAFETY_LIMIT");
}
