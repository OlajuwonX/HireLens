import Link from "next/link";
import { ScoreRing } from "@/components/data-display/score-ring";
import type { ApplicationListRow } from "@/features/applications/server/application.repository";
import { ApplicationStatusBadge } from "./application-status-badge";
import { SavedJobCard } from "./saved-job-card";

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
        <SavedJobCard
          key={row.publicId}
          publicId={row.publicId}
          title={row.title}
          archived={Boolean(row.archivedAt)}
          statusBadge={<ApplicationStatusBadge status={row.status} />}
        >
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/dashboard/jobs?${query ? `${query}&` : ""}open=${row.publicId}`}
              className="min-w-0 flex-1 before:absolute before:inset-0 before:content-['']"
            >
              <p className="truncate text-meta font-semibold text-text-primary">
                {row.title}
              </p>
              <p className="truncate text-label text-text-secondary">
                {row.company}
              </p>
            </Link>
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
        </SavedJobCard>
      ))}
    </ul>
  );
}
