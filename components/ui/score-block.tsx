import { cn } from "@/lib/utils";
import { Progress } from "./progress";

function bandFor(score: number) {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Partial match";
  if (score >= 40) return "Weak match";
  return "Poor match";
}

export function ScoreBlock({
  label,
  score,
  caption,
  className,
}: {
  label: string;
  score: number;
  caption?: string;
  className?: string;
}) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));

  return (
    <div className={cn("space-y-3", className)}>
      <p className="font-mono text-system font-medium uppercase text-text-muted">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-card-metric font-semibold text-text-primary">
          {safeScore}
        </span>
        <span className="text-meta text-text-muted">/ 100</span>
      </div>
      <p className="text-meta text-text-secondary">
        {caption ?? bandFor(safeScore)}
      </p>
      <Progress
        value={safeScore}
        aria-label={`${label} ${safeScore} out of 100`}
      />
    </div>
  );
}

export function ScoreRow({
  label,
  score,
  className,
}: {
  label: string;
  score: number;
  className?: string;
}) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-b-0",
        className,
      )}
    >
      <span className="text-meta text-text-secondary">{label}</span>
      <span className="font-mono text-meta font-medium text-text-primary tabular-nums">
        {safeScore}
      </span>
    </div>
  );
}
