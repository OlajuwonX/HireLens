import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorEventTable } from "@/features/admin/components/error-event-table";
import { requireAdminUser } from "@/features/admin/server/require-admin";
import { listRecentErrorEvents } from "@/features/admin/server/error-events.repository";
import { findBugReportsBySentryEventIds } from "@/features/bug-reports/server/bug-report.repository";

export const metadata: Metadata = {
  title: "Errors",
};

const RECENT_LIMIT = 50;

export default async function AdminErrorsPage() {
  await requireAdminUser();

  const events = await listRecentErrorEvents(RECENT_LIMIT);
  const sentryEventIds = events
    .map((event) => event.sentryEventId)
    .filter((id): id is string => Boolean(id));

  const linkedReports = await findBugReportsBySentryEventIds(sentryEventIds);
  const bugReportBySentryEventId = new Map(
    linkedReports.map((report) => [report.sentryEventId, report.publicId]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Errors"
        description="Recent issues reported by Sentry, newest first."
      />

      {events.length === 0 ? (
        <EmptyState
          title="No errors yet"
          description="Nothing has come through the Sentry webhook. Confirm the Internal Integration is configured if you expect activity here."
        />
      ) : (
        <ErrorEventTable
          rows={events}
          bugReportBySentryEventId={bugReportBySentryEventId}
        />
      )}
    </div>
  );
}
