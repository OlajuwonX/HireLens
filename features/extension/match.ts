export const MATCH_FLOOR = 85;
export const MATCH_TARGET = 90;
export const MAX_BOOST_STEPS = 3;

export type BoostStep = "analyze" | "refine" | "done";

export function needsBoost(score: number | null) {
  return score === null || score < MATCH_FLOOR;
}

export function nextBoostStep(input: { analyzed: boolean; score: number | null }): BoostStep {
  if (!input.analyzed) {
    return "analyze";
  }

  return input.score !== null && input.score >= MATCH_TARGET ? "done" : "refine";
}

export function boostFinished(input: { score: number | null; previous: number | null; stuck: boolean }) {
  if (input.stuck || input.score === null || input.score >= MATCH_TARGET) {
    return true;
  }

  if (input.previous === null) {
    return input.score >= MATCH_FLOOR;
  }

  return input.score <= input.previous;
}
