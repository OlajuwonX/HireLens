import type { UsageAction } from "@/lib/db/schema";

export const AI_BURST_LIMIT = 3;
export const AI_BURST_WINDOW_SECONDS = 60;
export const AI_RESERVATION_TTL_SECONDS = 120;

export const defaultDailyAllowance: Record<UsageAction, number> = {
  GENERAL_ANALYSIS: 5,
  JOB_ANALYSIS: 10,
  COVER_LETTER: 5,
  APPLICATION_MESSAGE: 15,
  IMPROVED_RESUME: 5,
  PROFESSIONAL_SUMMARY: 15,
  KEYWORD_ANALYSIS: 10,
  BULLET_REWRITE: 15,
  FOLLOW_UP_MESSAGE: 15,
};

export const usageActionLabels: Record<UsageAction, string> = {
  GENERAL_ANALYSIS: "Resume analyses",
  JOB_ANALYSIS: "Job-fit analyses",
  COVER_LETTER: "Cover letters",
  APPLICATION_MESSAGE: "Application messages",
  IMPROVED_RESUME: "Improved resumes",
  PROFESSIONAL_SUMMARY: "Professional summaries",
  KEYWORD_ANALYSIS: "Keyword analyses",
  BULLET_REWRITE: "Bullet rewrites",
  FOLLOW_UP_MESSAGE: "Follow-up messages",
};
