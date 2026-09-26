export const SAVE_INTENTS = ["save", "analyze"] as const;

export type SaveIntent = (typeof SAVE_INTENTS)[number];

export type AnalysisState = "scored" | "failed" | "saved";

export function parseSaveIntent(value: unknown): SaveIntent | null {
  if (value === null || value === undefined || value === "") {
    return "analyze";
  }

  return SAVE_INTENTS.find((intent) => intent === value) ?? null;
}

export function resolveAnalysisState(input: {
  saveOnly: boolean;
  matchScore: number | null;
}): AnalysisState {
  if (input.saveOnly) {
    return "saved";
  }

  return input.matchScore === null ? "failed" : "scored";
}

export const SAVE_ONLY_REASON =
  "Saved without analysis, so there is no score and AI Documents is unavailable.";

export const SAVE_ONLY_ANALYZE_MESSAGE =
  "This job was saved without analysis and cannot be analysed.";

export const SAVE_ONLY_DOCUMENT_MESSAGE =
  "AI documents are not available for a job saved without analysis.";
