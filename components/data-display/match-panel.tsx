import type { ReactNode } from "react";
import { clampScore, scoreToneFor } from "@/lib/design/score-band";
import { cn } from "@/lib/utils";
import { ScoreBar, toneText } from "./score-bar";

export type MatchPart = { label: string; score: number };

export function MatchPanel({
  title = "The match",
  context,
  total,
  parts,
  footer,
  className,
}: {
  title?: string;
  context?: string;
  total: number;
  parts: MatchPart[];
  footer?: ReactNode;
  className?: string;
}) {
  const value = clampScore(total);
  const { tone, label } = scoreToneFor(value);

  return (
    <section
      aria-label={`${title}: ${label}, ${value} out of 100`}
      className={cn("grid gap-5 rounded-card bg-ink p-5 text-ink-text sm:p-6", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-mono text-system font-semibold uppercase">{title}</h3>
        {context ? <p className="min-w-0 truncate font-mono text-system text-ink-muted">{context}</p> : null}
      </div>

      <div className="flex items-baseline gap-3">
        <span data-numeric className="text-display font-semibold">
          {value}
        </span>
        <span className={cn("font-mono text-system font-medium uppercase", toneText[tone])}>{label}</span>
      </div>

      {parts.length > 0 ? (
        <div className="grid gap-3.5">
          {parts.map((part) => (
            <ScoreBar key={part.label} label={part.label} score={part.score} />
          ))}
        </div>
      ) : null}

      {footer ? (
        <div className="border-t border-ink-line pt-4 text-label leading-relaxed text-ink-muted">{footer}</div>
      ) : null}
    </section>
  );
}
