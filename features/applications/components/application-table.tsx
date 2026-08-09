import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApplicationRow } from "@/features/applications/server/application.repository";
import { ApplicationStatusBadge } from "./application-status-badge";
import { StatusSelectForm } from "./status-select-form";

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString() : "—";
}

function Score({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-text-muted">—</span>;
  }

  return (
    <span className="font-mono font-medium tabular-nums text-text-primary">
      {value}
    </span>
  );
}

export function ApplicationTable({
  rows,
  query,
}: {
  rows: ApplicationRow[];
  query: string;
}) {
  const href = (publicId: string) =>
    `/dashboard/jobs?${query ? `${query}&` : ""}open=${publicId}`;

  return (
    <>
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.application.publicId}>
                <TableCell>
                  <Link
                    href={href(row.application.publicId)}
                    className="font-medium text-text-primary underline-offset-4 hover:underline"
                  >
                    {row.job.title}
                  </Link>
                </TableCell>
                <TableCell>{row.job.company}</TableCell>
                <TableCell>{row.versionLabel ?? "—"}</TableCell>
                <TableCell>
                  <Score value={row.matchScore} />
                </TableCell>
                <TableCell>{formatDate(row.application.createdAt)}</TableCell>
                <TableCell>{formatDate(row.job.deadlineAt)}</TableCell>
                <TableCell>
                  <ApplicationStatusBadge status={row.application.status} />
                </TableCell>
                <TableCell>
                  <StatusSelectForm
                    publicId={row.application.publicId}
                    status={row.application.status}
                    selectId={`status-table-${row.application.publicId}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface md:hidden">
        {rows.map((row) => (
          <li key={row.application.publicId} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={href(row.application.publicId)} className="min-w-0">
                <p className="truncate text-meta font-semibold text-text-primary">
                  {row.job.title}
                </p>
                <p className="truncate text-label text-text-muted">
                  {row.job.company}
                </p>
              </Link>
              <ApplicationStatusBadge status={row.application.status} />
            </div>

            <dl className="grid grid-cols-2 gap-2 text-label text-text-secondary">
              <div>
                <dt className="text-text-muted">Match</dt>
                <dd>
                  <Score value={row.matchScore} />
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Deadline</dt>
                <dd>{formatDate(row.job.deadlineAt)}</dd>
              </div>
            </dl>

            <StatusSelectForm
              publicId={row.application.publicId}
              status={row.application.status}
              selectId={`status-card-${row.application.publicId}`}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
