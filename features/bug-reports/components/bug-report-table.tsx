import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { OPS_CONSOLE_PATH } from "@/features/admin/constants";
import type { BugReportListRow } from "../server/bug-report.repository";
import {
  bugCategoryLabels,
  bugStatusLabels,
  bugStatusTone,
} from "../constants";

function shortDate(value: Date) {
  return value.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BugReportTable({ rows }: { rows: BugReportListRow[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
      {rows.map((row) => (
        <li key={row.publicId}>
          <Link
            href={`${OPS_CONSOLE_PATH}/${row.publicId}`}
            className="flex flex-col gap-2 p-4 transition-colors hover:bg-surface-secondary md:flex-row md:items-center md:gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-meta font-medium text-text-primary">
                {row.title}
              </p>
              <p className="truncate font-mono text-system text-text-muted">
                {row.reporterEmail} &middot; {row.route}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Badge>{bugCategoryLabels[row.category]}</Badge>
              <Badge tone={bugStatusTone[row.status]}>
                {bugStatusLabels[row.status]}
              </Badge>
              <span className="font-mono text-system text-text-muted">
                {shortDate(row.createdAt)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
