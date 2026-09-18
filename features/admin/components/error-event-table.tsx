import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { OPS_CONSOLE_PATH } from "@/features/admin/constants";
import type { AdminErrorEvent } from "@/lib/db/schema";

function levelTone(level: string | null) {
  if (level === "fatal" || level === "error") {
    return "red" as const;
  }

  if (level === "warning") {
    return "yellow" as const;
  }

  return "neutral" as const;
}

function shortDate(value: Date | null) {
  if (!value) {
    return "Unknown";
  }

  return value.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ErrorEventTable({
  rows,
  bugReportBySentryEventId,
}: {
  rows: AdminErrorEvent[];
  bugReportBySentryEventId: Map<string | null, string>;
}) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
      {rows.map((row) => {
        const linkedReportId = bugReportBySentryEventId.get(row.sentryEventId);

        return (
          <li
            key={row.id}
            className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between md:gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-meta font-medium text-text-primary">
                {row.title}
              </p>
              {row.culprit ? (
                <p className="truncate font-mono text-system text-text-muted">
                  {row.culprit}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {row.level ? (
                <Badge tone={levelTone(row.level)}>{row.level}</Badge>
              ) : null}
              <span className="font-mono text-system text-text-muted">
                {row.eventCount} events
              </span>
              <span className="font-mono text-system text-text-muted">
                Last seen {shortDate(row.lastSeen)}
              </span>
              {linkedReportId ? (
                <Link
                  href={`${OPS_CONSOLE_PATH}/${linkedReportId}`}
                  className="font-mono text-system text-info underline-offset-2 hover:underline"
                >
                  Bug report
                </Link>
              ) : null}
              {row.permalink ? (
                <a
                  href={row.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-system text-info underline-offset-2 hover:underline"
                >
                  Open in Sentry
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
