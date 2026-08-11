import { z } from "zod";

const score = z.number().int().min(0).max(100);

export const scoringSchema = z.object({
  overallScore: score,
  atsScore: score,
  requirementsScore: score,
  skillsScore: score,
  experienceScore: score,
  keywordScore: score,
  explanation: z.string().min(1),
});

export type Scoring = z.infer<typeof scoringSchema>;
