import { z } from "zod";
import { applicationEmailSchema } from "./application-email.schema";
import { bulletRewriteSchema } from "./bullet-rewrites.schema";
import { improvedResumeSchema } from "./improved-resume.schema";
import { keywordAnalysisSchema } from "./keywords.schema";
import {
  emptyOptimizationPlan,
  optimizationPlanSchema,
} from "./optimization-plan.schema";
import { recommendationSchema } from "./recommendations.schema";
import { requirementMatchSchema } from "./requirements.schema";
import { scoringSchema } from "./scoring.schema";

export const applicationIntelligenceSchema = z.object({
  requirementMatches: z.array(requirementMatchSchema),
  keywordAnalysis: keywordAnalysisSchema,
  optimizationPlan: optimizationPlanSchema,
  improvedResume: improvedResumeSchema,
  bulletRewrites: z.array(bulletRewriteSchema),
  professionalSummary: z.string().min(1),
  coverLetter: z.string().min(1),
  applicationEmail: applicationEmailSchema,
  followUpMessage: z.string().min(1),
  recommendations: z.array(recommendationSchema),
  scoring: scoringSchema,
});

export type ApplicationIntelligence = z.infer<
  typeof applicationIntelligenceSchema
>;

const emptyKeywordAnalysis = {
  present: [],
  transferable: [],
  missing: [],
  avoidForcing: [],
};

const emptyImprovedResume = {
  header: {
    name: "",
    headline: "",
    location: null,
    email: null,
    phone: null,
    links: [],
  },
  professionalSummary: "",
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  additionalSections: [],
};

export const storedApplicationIntelligenceSchema = z.object({
  scoring: scoringSchema.partial().catch({}),
  recommendations: z.array(recommendationSchema).catch([]),
  keywordAnalysis: keywordAnalysisSchema.catch(emptyKeywordAnalysis),
  requirementMatches: z.array(requirementMatchSchema).catch([]),
  optimizationPlan: optimizationPlanSchema.catch(emptyOptimizationPlan),
  improvedResume: improvedResumeSchema.catch(emptyImprovedResume),
  bulletRewrites: z.array(bulletRewriteSchema).catch([]),
  professionalSummary: z.string().catch(""),
  coverLetter: z.string().catch(""),
  applicationEmail: applicationEmailSchema
    .partial()
    .catch({})
    .transform((value) => ({
      subject: value.subject ?? "",
      body: value.body ?? "",
    })),
  followUpMessage: z.string().catch(""),
});

export type StoredApplicationIntelligence = z.infer<
  typeof storedApplicationIntelligenceSchema
>;
