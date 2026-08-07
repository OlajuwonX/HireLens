import { z } from "zod";

export const analysisRecommendationSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  problem: z.string().min(1),
  reason: z.string().min(1),
  action: z.string().min(1),
});

export const generalResumeAnalysisSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  atsScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  recommendations: z.array(analysisRecommendationSchema),
});

export type GeneralResumeAnalysis = z.infer<typeof generalResumeAnalysisSchema>;
