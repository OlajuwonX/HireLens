import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";

export const evidenceCorrectionSchema = z.object({
  analysisId: z.string().uuid(),
  requirementKey: z.string().min(1).max(200),
  markedIncorrect: z.coerce.boolean().default(false),
  evidence: z.preprocess(
    blankToUndefined,
    z.string().trim().max(5_000).optional(),
  ),
  notes: z.preprocess(blankToUndefined, z.string().trim().max(2_000).optional()),
});

export type EvidenceCorrectionInput = z.infer<typeof evidenceCorrectionSchema>;
