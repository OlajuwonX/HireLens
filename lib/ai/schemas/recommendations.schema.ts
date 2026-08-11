import { z } from "zod";

export const recommendationPriorities = ["HIGH", "MEDIUM", "LOW"] as const;

export const recommendationSchema = z.object({
  problem: z.string().min(1),
  evidence: z.string().nullable(),
  recommendedAction: z.string().min(1),
  reason: z.string().min(1),
  priority: z.enum(recommendationPriorities),
});

export type Recommendation = z.infer<typeof recommendationSchema>;
