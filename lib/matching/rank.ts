import type { EligibilityVerdict } from "./eligibility";

export const SHORTLIST_SIZE = 30;
export const SHORTLIST_MIN_SCORE = 55;
const CHECK_PENALTY = 10;

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9+#]+/)
      .filter((token) => token.length > 1),
  );
}

export function relevanceHint(title: string, targets: string[]) {
  const titleTokens = tokens(title);
  const best = targets.map((target) => {
    const targetTokens = [...tokens(target)];
    const hits = targetTokens.filter((token) => titleTokens.has(token)).length;

    return targetTokens.length === 0 ? 0 : hits / targetTokens.length;
  });

  return Math.max(0, ...best);
}

export function rankScore(score: number, verdict: EligibilityVerdict) {
  return Math.max(0, score - (verdict === "CHECK" ? CHECK_PENALTY : 0));
}

export function isShortlisted(match: { rank: number | null; verdict: EligibilityVerdict }) {
  return match.verdict !== "FAIL" && match.rank !== null && match.rank >= SHORTLIST_MIN_SCORE;
}
