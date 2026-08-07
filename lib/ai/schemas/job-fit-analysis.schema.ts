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

export const jobFitAnalysisSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  atsScore: z.number().int().min(0).max(100),
  jobFitScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  missingRequirements: z.array(z.string().min(1)),
  requirementMatches: z.array(requirementMatchSchema),
  recommendations: z.array(analysisRecommendationSchema),
});

export type JobFitAnalysis = z.infer<typeof jobFitAnalysisSchema>;
