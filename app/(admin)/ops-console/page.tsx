import type { Metadata } from "next";
import { MetricCard } from "@/components/data-display/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadMore } from "@/components/ui/load-more";
import {
  requireAdminUser,
  OPS_CONSOLE_PATH,
} from "@/features/admin/server/require-admin";
import { BugReportFilters } from "@/features/bug-reports/components/bug-report-filters";
import { BugReportTable } from "@/features/bug-reports/components/bug-report-table";
import { bugFiltersSchema } from "@/features/bug-reports/schemas/bug-report.schema";
import {
  countBugReportsByStatus,
  listBugReports,
} from "@/features/bug-reports/server/bug-report.repository";

export const metadata: Metadata = {
  title: "Bug reports",
};

const PAGE_SIZE = 25;

export default async function OpsConsolePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminUser();

  const raw = await searchParams;
  const parsed = bugFiltersSchema.safeParse({
    q: raw.q,
    status: raw.status,
    category: raw.category,
  });
  const filters = parsed.success ? parsed.data : {};

  const page = Number.parseInt(
    typeof raw.page === "string" ? raw.page : "1",
    10,
  );
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

  const [rows, counts] = await Promise.all([
    listBugReports({
      filters,
      limit: PAGE_SIZE + 1,
      offset: (currentPage - 1) * PAGE_SIZE,
    }),
    countBugReportsByStatus(),
  ]);

  const visible = rows.slice(0, PAGE_SIZE);
  const hasMore = rows.length > PAGE_SIZE;
  const total =
    (counts.OPEN ?? 0) + (counts.IN_REVIEW ?? 0) + (counts.RESOLVED ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bug reports"
        description="Everything reported from the Help screen, newest first."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Total" value={total} />
        <MetricCard label="Open" value={counts.OPEN ?? 0} />
        <MetricCard label="In review" value={counts.IN_REVIEW ?? 0} />
        <MetricCard label="Resolved" value={counts.RESOLVED ?? 0} />
      </div>

      <BugReportFilters />

      {visible.length === 0 ? (
        <EmptyState
          title="No reports match"
          description="Try a different search, status or category."
        />
      ) : (
        <>
          <BugReportTable rows={visible} />
          {hasMore ? (
            <LoadMore basePath={OPS_CONSOLE_PATH} page={currentPage + 1} />
          ) : null}
        </>
      )}
    </div>
  );
}
