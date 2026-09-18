import { Badge } from "@/components/ui/badge";
import type { ActionBreakdownRow } from "@/features/admin/server/feature-usage.service";

export function UsageBreakdownTable({ rows }: { rows: ActionBreakdownRow[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
      {rows.map((row) => (
        <li
          key={row.action}
          className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between md:gap-4"
        >
          <p className="text-meta font-medium text-text-primary">
            {row.label}
          </p>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="font-mono text-system text-text-muted">
              {row.total} total
            </span>
            <Badge tone="green">{row.completed} completed</Badge>
            {row.failed > 0 ? (
              <Badge tone="red">{row.failed} failed</Badge>
            ) : null}
            {row.reserved > 0 ? (
              <Badge tone="yellow">{row.reserved} in progress</Badge>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
