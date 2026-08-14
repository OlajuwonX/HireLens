import Link from "next/link";
import { ScoreRing } from "@/components/data-display/score-ring";
import type { ApplicationListRow } from "@/features/applications/server/application.repository";
import { ApplicationStatusBadge } from "./application-status-badge";

function shortDate(value: Date | null) {
  return value
    ? value.toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : "--";
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-system uppercase text-text-muted">
        {label}
      </dt>
      <dd className="truncate text-label text-text-secondary">{value}</dd>
    </div>
  );
}

export function ApplicationCardGrid({
  rows,
  query,
}: {
  rows: ApplicationListRow[];
  query: string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((row) => (
        <li key={row.publicId}>
          <Link
            href={`/dashboard/jobs?${query ? `${query}&` : ""}open=${row.publicId}`}
            className="flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-surface-secondary focus-visible:border-accent-hover sm:p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-meta font-semibold text-text-primary">
                  {row.title}
                </p>
                <p className="truncate text-label text-text-secondary">
                  {row.company}
                </p>
              </div>
              <ScoreRing
                score={row.matchScore}
                size={44}
                className="max-sm:hidden"
              />
              <ScoreRing score={row.matchScore} size={38} className="sm:hidden" />
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
              <Meta label="Resume" value={row.versionLabel ?? "Not set"} />
              <Meta label="Added" value={shortDate(row.createdAt)} />
              <Meta label="Deadline" value={shortDate(row.deadlineAt)} />
            </dl>

            <div className="mt-auto pt-0.5">
              <ApplicationStatusBadge status={row.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
