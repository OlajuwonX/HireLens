import "server-only";

import { storedJobFitAnalysisSchema } from "@/lib/ai/schemas/job-fit-analysis.schema";
import {
  findAnalysisById,
  listAnalysisSuggestions,
} from "./analysis.repository";
import { listRequirementMatchesForAnalysis } from "./requirement-match.repository";

export async function getAnalysisReport(input: {
  userId: string;
  analysisId: string;
}) {
  const analysis = await findAnalysisById(input);

  if (!analysis) {
    return null;
  }

  const [matches, suggestions] = await Promise.all([
    listRequirementMatchesForAnalysis(input),
    listAnalysisSuggestions(input),
  ]);

  const parsed = storedJobFitAnalysisSchema.safeParse(
    analysis.normalizedResult ?? {},
  );

  return {
    analysis,
    result: parsed.success ? parsed.data : null,
    matches,
    suggestions,
  };
}

export type AnalysisReport = NonNullable<
  Awaited<ReturnType<typeof getAnalysisReport>>
>;
