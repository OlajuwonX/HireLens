import type { CSSProperties } from "react";
import { clampScore, scoreToneFor, type ScoreTone } from "@/lib/design/score-band";
import { cn } from "@/lib/utils";

export const toneText: Record<ScoreTone, string> = {
  strong: "text-accent",
  fair: "text-ink-text",
  gap: "text-ink-caution",
};

export function DitherBar({ score, className }: { score: number; className?: string }) {
  const value = clampScore(score);

  return (
    <span aria-hidden className={cn("dither-track relative block h-3.5 text-ink-line", className)}>
      <span
        data-score-fill
        style={{ "--score-rest": `${100 - value}%` } as CSSProperties}
        className={cn(
          "dither-fill absolute inset-0 [clip-path:inset(0_var(--score-rest)_0_0)] transition-[clip-path] duration-700 ease-out starting:[clip-path:inset(0_100%_0_0)]",
          toneText[scoreToneFor(value).tone],
        )}
      />
    </span>
  );
}

export function ScoreBar({ label, score }: { label: string; score: number }) {
  const value = clampScore(score);

  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3 font-mono text-system font-medium uppercase">
        <span className="text-ink-text">{label}</span>
        <span data-numeric className="text-ink-muted">
          {value} / 100
        </span>
      </div>
      <DitherBar score={value} />
    </div>
  );
}
