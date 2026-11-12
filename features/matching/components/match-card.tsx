import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MatchFit } from "@/lib/ai/schemas/job-matching.schema";
import { dismissMatchAction } from "../actions/matching-actions";
import type { MatchView } from "../match-view";
import { OpenPostingButton } from "./open-posting-button";

const fitTone: Record<MatchFit, "green" | "blue" | "yellow" | "neutral"> = {
  STRONG: "green",
  GOOD: "blue",
  STRETCH: "yellow",
  POOR: "neutral",
};

function Points({ label, items }: { label: string; items: string[] }) {
  return items.length === 0 ? null : (
    <div className="space-y-0.5">
      <p className="font-mono text-system uppercase text-text-muted">{label}</p>
      <ul className="list-disc space-y-0.5 pl-4 text-label text-text-secondary">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function MatchCard({ match }: { match: MatchView }) {
  const warnings = match.reasons.filter((reason) => reason.verdict === "CHECK");

  return (
    <li className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-meta font-semibold text-text-primary">{match.title}</p>
          <p className="truncate text-label text-text-secondary">
            {[match.company, match.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-section-title text-text-primary">{match.rank}</span>
          {match.fit ? <Badge tone={fitTone[match.fit]}>{match.fit.toLowerCase()}</Badge> : null}
        </div>
      </div>

      {match.insight?.summary ? (
        <p className="text-meta text-text-primary">{match.insight.summary}</p>
      ) : null}

      <Points label="Why it fits" items={match.insight?.strengths ?? []} />
      <Points label="Gaps" items={match.insight?.gaps ?? []} />
      <Points label="Check first" items={warnings.map((reason) => reason.text)} />

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <OpenPostingButton publicId={match.postingPublicId} />
        <form action={dismissMatchAction}>
          <input type="hidden" name="publicId" value={match.publicId} />
          <Button type="submit" variant="outline" size="compact">
            Not interested
          </Button>
        </form>
      </div>
    </li>
  );
}
