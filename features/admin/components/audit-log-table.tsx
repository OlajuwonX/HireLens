import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  ADMIN_TARGET_TYPES,
  OPS_CONSOLE_PATH,
  adminActionLabels,
  type AdminAction,
} from "@/features/admin/constants";
import type { AuditLogListRow } from "@/features/admin/server/audit-log.repository";

function shortDate(value: Date) {
  return value.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function targetLabel(row: AuditLogListRow) {
  const metadata = row.metadata as Record<string, unknown> | null;
  const targetEmail = typeof metadata?.targetEmail === "string" ? metadata.targetEmail : null;

  if (row.targetType === ADMIN_TARGET_TYPES.USER) {
    return targetEmail ?? row.targetId;
  }

  return row.targetId;
}

export function AuditLogTable({ rows }: { rows: AuditLogListRow[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
      {rows.map((row) => (
        <li
          key={row.publicId}
          className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between md:gap-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-meta font-medium text-text-primary">
              {adminActionLabels[row.action as AdminAction] ?? row.action}
            </p>
            <p className="truncate font-mono text-system text-text-muted">
              {row.actorEmail} &middot; {targetLabel(row)}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge>{row.targetType}</Badge>
            {row.targetType === ADMIN_TARGET_TYPES.BUG_REPORT ? (
              <Link
                href={`${OPS_CONSOLE_PATH}/${row.targetId}`}
                className="font-mono text-system text-info underline-offset-2 hover:underline"
              >
                View report
              </Link>
            ) : null}
            <span className="font-mono text-system text-text-muted">
              {shortDate(row.createdAt)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
