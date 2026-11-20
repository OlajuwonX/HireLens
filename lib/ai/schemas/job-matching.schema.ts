import { z } from "zod";

export const matchFits = ["STRONG", "GOOD", "STRETCH", "POOR"] as const;

export const jobMatchSchema = z.object({
  ref: z.string().min(1),
  score: z.number().int().min(0).max(100),
  fit: z.enum(matchFits),
  strengths: z.array(z.string().min(1)),
  gaps: z.array(z.string().min(1)),
  summary: z.string().min(1),
});

export const jobMatchingSchema = z.object({
  matches: z.array(jobMatchSchema),
});

export type MatchFit = (typeof matchFits)[number];
export type JobMatchResult = z.infer<typeof jobMatchSchema>;
