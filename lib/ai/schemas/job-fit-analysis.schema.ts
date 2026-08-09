import { z } from "zod";
import { analysisRecommendationSchema } from "./resume-analysis.schema";

export const requirementMatchSchema = z.object({
  id: z.string().min(1),
  requirement: z.string().min(1),
  category: z.enum([
    "SKILL",
    "EXPERIENCE",
    "EDUCATION",
    "CERTIFICATION",
    "RESPONSIBILITY",
    "LOCATION",
    "OTHER",
  ]),
  importance: z.enum(["REQUIRED", "PREFERRED"]),
  status: z.enum(["STRONG", "PARTIAL", "MISSING", "UNCLEAR"]),
  resumeEvidence: z.string().nullable(),
  explanation: z.string().min(1),
  recommendation: z.string().nullable(),
});

export const scoreWithExplanationSchema = z.object({
  score: z.number().int().min(0).max(100),
  explanation: z.string().min(1),
});

export const keywordGapSchema = z.object({
  keyword: z.string().min(1),
  status: z.enum(["PRESENT", "WEAK", "MISSING"]),
  recommendation: z.string().min(1),
});

export const keywordGroupsSchema = z.object({
  skills: z.array(keywordGapSchema),
  tools: z.array(keywordGapSchema),
  responsibilities: z.array(keywordGapSchema),
  industryLanguage: z.array(keywordGapSchema),
  certifications: z.array(keywordGapSchema),
  experienceTerms: z.array(keywordGapSchema),
});

export const bulletIssueSchema = z.object({
  original: z.string().min(1),
  issue: z.string().min(1),
  recommendation: z.string().min(1),
});

export const jobFitAnalysisSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  atsScore: z.number().int().min(0).max(100),
  jobFitScore: z.number().int().min(0).max(100),
  scoreExplanations: z.object({
    overall: scoreWithExplanationSchema,
    ats: scoreWithExplanationSchema,
    jobFit: scoreWithExplanationSchema,
  }),
  summary: z.string().min(1),
  summaryRecommendation: z.string().min(1),
  missingRequirements: z.array(z.string().min(1)),
  keywordGroups: keywordGroupsSchema,
  bulletIssues: z.array(bulletIssueSchema),
  requirementMatches: z.array(requirementMatchSchema),
  recommendations: z.array(analysisRecommendationSchema),
});

export type JobFitAnalysis = z.infer<typeof jobFitAnalysisSchema>;
