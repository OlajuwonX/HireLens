import { z } from "zod";

export const transferableKeywordSchema = z.object({
  required: z.string().min(1),
  existingEvidence: z.string().min(1),
});

export const missingKeywordSchema = z.object({
  keyword: z.string().min(1),
  gapType: z.enum(["QUALIFICATION_GAP", "WORDING_ONLY"]),
  explanation: z.string().min(1),
});

export const keywordAnalysisSchema = z.object({
  present: z.array(z.string().min(1)),
  transferable: z.array(transferableKeywordSchema),
  missing: z.array(missingKeywordSchema),
  avoidForcing: z.array(z.string().min(1)),
});

export type KeywordAnalysis = z.infer<typeof keywordAnalysisSchema>;
