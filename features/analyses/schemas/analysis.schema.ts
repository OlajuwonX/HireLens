import { z } from "zod";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const runJobFitSchema = z.object({
  jobPublicId: z.string().uuid(),
  versionPublicId: z.string().uuid("Select a resume version"),
});

export const evidenceCorrectionSchema = z.object({
  matchId: z.string().uuid(),
  analysisPublicId: z.string().uuid(),
  markedIncorrect: z.coerce.boolean().default(false),
  evidence: z.preprocess(
    blankToUndefined,
    z.string().trim().max(5_000).optional(),
  ),
  notes: z.preprocess(
    blankToUndefined,
    z.string().trim().max(2_000).optional(),
  ),
});

export type EvidenceCorrectionInput = z.infer<typeof evidenceCorrectionSchema>;
