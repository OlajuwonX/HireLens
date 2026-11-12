import type { MatchView } from "../match-view";

export function ScreenedOutList({ matches }: { matches: MatchView[] }) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <details className="rounded-card border border-border bg-surface p-3 sm:p-4">
      <summary className="cursor-pointer text-meta font-medium text-text-primary">
        Screened out by your profile ({matches.length})
      </summary>
      <ul className="mt-3 divide-y divide-border">
        {matches.map((match) => (
          <li key={match.publicId} className="space-y-0.5 py-2">
            <p className="text-meta text-text-primary">
              {match.title} <span className="text-text-muted">· {match.company}</span>
            </p>
            <p className="text-label text-text-secondary">
              {match.reasons.map((reason) => reason.text).join(" ")}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}
