export type ScoreBand = "STRONG" | "GOOD" | "FAIR" | "WEAK" | "POOR";

export type ScoreBandSpec = {
  band: ScoreBand;
  label: string;
  from: string;
  to: string;
};

const BANDS: (ScoreBandSpec & { min: number })[] = [
  { min: 85, band: "STRONG", label: "Strong match", from: "#3fae5a", to: "#8fd94a" },
  { min: 80, band: "GOOD", label: "Good match", from: "#8fd94a", to: "#c9e14a" },
  { min: 70, band: "FAIR", label: "Fair match", from: "#e0c93c", to: "#f0d84a" },
  { min: 62, band: "WEAK", label: "Weak match", from: "#e79a3c", to: "#efc44a" },
  { min: 0, band: "POOR", label: "Poor match", from: "#d94848", to: "#e77a5c" },
];

export function scoreBandFor(score: number): ScoreBandSpec {
  const clamped = Math.min(100, Math.max(0, score));
  const match = BANDS.find((entry) => clamped >= entry.min) ?? BANDS[BANDS.length - 1];

  return {
    band: match.band,
    label: match.label,
    from: match.from,
    to: match.to,
  };
}
