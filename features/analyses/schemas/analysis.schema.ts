import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";

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
