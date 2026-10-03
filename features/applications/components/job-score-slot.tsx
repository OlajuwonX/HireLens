import { ScoreRing } from "@/components/data-display/score-ring";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { resolveAnalysisState } from "../analysis-state";

export function JobScoreSlot({
  saveOnly,
  matchScore,
  size,
  className,
}: {
  saveOnly: boolean;
  matchScore: number | null;
  size: number;
  className?: string;
}) {
  const state = resolveAnalysisState({ saveOnly, matchScore });

  if (state === "saved") {
    return (
      <div
        aria-hidden
        data-score-slot="saved"
        style={{ width: size, height: size }}
        className={cn("shrink-0", className)}
      />
    );
  }

  if (state === "failed") {
    return (
      <div
        role="img"
        aria-label="Analysis failed"
        title="Analysis failed"
        data-score-slot="failed"
        style={{ width: size, height: size }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-danger/50 text-danger",
          className,
        )}
      >
        <AlertTriangle className="size-4" aria-hidden />
      </div>
    );
  }

  return <ScoreRing score={matchScore} size={size} className={className} />;
}
