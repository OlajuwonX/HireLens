import type { AiView } from "@/features/analyses/server/analysis.mapper";

export const DOCUMENT_TYPES = [
  "IMPROVED_RESUME",
  "COVER_LETTER",
  "APPLICATION_EMAIL",
  "PROFESSIONAL_SUMMARY",
  "KEYWORD_ANALYSIS",
  "BULLET_REWRITE",
  "FOLLOW_UP_MESSAGE",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const documentTypeForView: Record<AiView, DocumentType> = {
  RECOMMENDATIONS: "KEYWORD_ANALYSIS",
  KEYWORD_ANALYSIS: "KEYWORD_ANALYSIS",
  IMPROVED_RESUME: "IMPROVED_RESUME",
  BULLET_REWRITE: "BULLET_REWRITE",
  PROFESSIONAL_SUMMARY: "PROFESSIONAL_SUMMARY",
  COVER_LETTER: "COVER_LETTER",
  APPLICATION_EMAIL: "APPLICATION_EMAIL",
  FOLLOW_UP_MESSAGE: "FOLLOW_UP_MESSAGE",
};

export const documentTypeLabels: Record<string, string> = {
  IMPROVED_RESUME: "Improved resume",
  COVER_LETTER: "Cover letter",
  APPLICATION_EMAIL: "Application email",
  PROFESSIONAL_SUMMARY: "Professional summary",
  KEYWORD_ANALYSIS: "Keyword gap analysis",
  BULLET_REWRITE: "Bullet rewrites",
  FOLLOW_UP_MESSAGE: "Follow-up message",
  EMAIL_SUBJECT: "Email subject",
  LINKEDIN_MESSAGE: "LinkedIn message",
  FOLLOW_UP_EMAIL: "Follow-up email",
  THANK_YOU_EMAIL: "Thank-you email",
  PROFESSIONAL_INTRO: "Professional intro",
  CAREER_CHANGE_EXPLANATION: "Career-change note",
  ENTRY_LEVEL_NOTE: "Entry-level note",
};
