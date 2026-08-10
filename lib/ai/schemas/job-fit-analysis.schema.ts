import { z } from "zod";

export const analysisRecommendationSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  problem: z.string().min(1),
  reason: z.string().min(1),
  action: z.string().min(1),
});

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

const emptyKeywordGroups = {
  skills: [],
  tools: [],
  responsibilities: [],
  industryLanguage: [],
  certifications: [],
  experienceTerms: [],
};

export const storedJobFitAnalysisSchema = z.object({
  overallScore: z.number().int().nullable().catch(null),
  atsScore: z.number().int().nullable().catch(null),
  jobFitScore: z.number().int().nullable().catch(null),
  scoreExplanations: z
    .object({
      overall: scoreWithExplanationSchema,
      ats: scoreWithExplanationSchema,
      jobFit: scoreWithExplanationSchema,
    })
    .partial()
    .catch({}),
  summary: z.string().catch(""),
  summaryRecommendation: z.string().catch(""),
  missingRequirements: z.array(z.string()).catch([]),
  keywordGroups: keywordGroupsSchema.catch(emptyKeywordGroups),
  bulletIssues: z.array(bulletIssueSchema).catch([]),
});

export type StoredJobFitAnalysis = z.infer<typeof storedJobFitAnalysisSchema>;

export const KEYWORD_GROUP_LABELS: Record<keyof typeof emptyKeywordGroups, string> = {
  skills: "Skills",
  tools: "Tools",
  responsibilities: "Responsibilities",
  industryLanguage: "Industry language",
  certifications: "Certifications",
  experienceTerms: "Experience terms",
};
