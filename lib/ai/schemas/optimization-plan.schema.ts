import { z } from "zod";

export const alignmentLevels = ["HIGH", "MEDIUM", "LOW"] as const;

export const optimizationIntensities = [
  "SURGICAL",
  "TARGETED",
  "SUBSTANTIAL",
] as const;

export const droppedEvidenceSchema = z.object({
  content: z.string().min(1),
  reason: z.string().min(1),
});

export const optimizationPlanSchema = z.object({
  alignment: z.enum(alignmentLevels),
  intensity: z.enum(optimizationIntensities),
  rationale: z.string().min(1),
  droppedEvidence: z.array(droppedEvidenceSchema),
});

export type OptimizationPlan = z.infer<typeof optimizationPlanSchema>;

export const emptyOptimizationPlan: OptimizationPlan = {
  alignment: "MEDIUM",
  intensity: "TARGETED",
  rationale: "",
  droppedEvidence: [],
};
