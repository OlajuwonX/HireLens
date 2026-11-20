import { z } from "zod";

export const reviewVerdicts = ["APPROVED", "NEEDS_CHANGES", "REJECTED"] as const;
export const reviewSeverities = ["CRITICAL", "MAJOR", "MINOR"] as const;
export const reviewCategories = [
  "FABRICATION",
  "LOST_EVIDENCE",
  "DATES",
  "NUMBERS",
  "TECHNOLOGY",
  "SENIORITY",
  "KEYWORDS",
  "BULLET_QUALITY",
  "SUMMARY",
  "READABILITY",
  "STRUCTURE",
] as const;

const score = z.number().int().min(0).max(100);

export const reviewIssueSchema = z.object({
  severity: z.enum(reviewSeverities),
  category: z.enum(reviewCategories),
  location: z.string(),
  problem: z.string().min(1),
  fix: z.string(),
});

export const resumeReviewSchema = z.object({
  verdict: z.enum(reviewVerdicts),
  scores: z.object({
    factualAccuracy: score,
    requirementCoverage: score,
    keywordRelevance: score,
    bulletQuality: score,
    readability: score,
    atsStructure: score,
  }),
  issues: z.array(reviewIssueSchema),
  summary: z.string().min(1),
});

export type ReviewVerdict = (typeof reviewVerdicts)[number];
export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
export type ResumeReview = z.infer<typeof resumeReviewSchema>;
