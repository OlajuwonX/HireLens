import { ScoreChip } from "@/components/data-display/score-chip";
import { cn } from "@/lib/utils";
import { resolveAnalysisState } from "../analysis-state";

export function JobScoreSlot({
  saveOnly,
  matchScore,
  className,
}: {
  saveOnly: boolean;
  matchScore: number | null;
  className?: string;
}) {
  const state = resolveAnalysisState({ saveOnly, matchScore });

  if (state === "saved") {
    return <span aria-hidden data-score-slot="saved" className={cn("w-14 shrink-0", className)} />;
  }

  if (state === "failed") {
    return (
      <span
        role="img"
        aria-label="Analysis failed"
        title="Analysis failed"
        data-score-slot="failed"
        className={cn(
          "grid w-14 shrink-0 place-items-center rounded-control border border-danger/50 py-1.5 font-mono text-label text-danger",
          className,
        )}
      >
        Failed
      </span>
    );
  }

  return <ScoreChip score={matchScore} className={className} />;
}
