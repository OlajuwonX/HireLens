export type ScoreTone = "strong" | "fair" | "gap";

export const SCORE_STRONG = 80;
export const SCORE_FAIR = 60;

const LABELS: Record<ScoreTone, string> = {
  strong: "Strong fit",
  fair: "Fair fit",
  gap: "Weak fit",
};

export function clampScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function scoreToneFor(score: number): { tone: ScoreTone; label: string } {
  const value = clampScore(score);
  const tone: ScoreTone = value >= SCORE_STRONG ? "strong" : value >= SCORE_FAIR ? "fair" : "gap";

  return { tone, label: LABELS[tone] };
}
