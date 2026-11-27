import { clampScore, scoreToneFor } from "@/lib/design/score-band";
import { cn } from "@/lib/utils";
import { DitherBar } from "./score-bar";

export function ScoreChip({ score, className }: { score: number | null; className?: string }) {
  if (score === null) {
    return (
      <span
        data-score-chip="empty"
        className={cn("grid w-14 shrink-0 place-items-center rounded-control bg-ink py-1.5 font-mono text-label text-ink-muted", className)}
      >
        --
      </span>
    );
  }

  const value = clampScore(score);

  return (
    <span
      role="img"
      aria-label={`${scoreToneFor(value).label}, ${value} out of 100`}
      data-score-chip=""
      className={cn("grid w-14 shrink-0 gap-1 rounded-control bg-ink px-2 py-1.5 text-ink-text", className)}
    >
      <span data-numeric className="text-right font-mono text-meta font-semibold leading-none">
        {value}
      </span>
      <DitherBar score={value} className="h-1.5" />
    </span>
  );
}
