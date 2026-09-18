import type { Metadata } from "next";
import { MetricCard } from "@/components/data-display/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { UsageBreakdownTable } from "@/features/admin/components/usage-breakdown-table";
import { requireAdminUser } from "@/features/admin/server/require-admin";
import {
  countEventsByActionStatus,
  countEventsSince,
} from "@/features/admin/server/feature-usage.repository";
import {
  buildActionBreakdown,
  failureRate,
  mostUsedActionLabel,
  startOfUtcDay,
} from "@/features/admin/server/feature-usage.service";

export const metadata: Metadata = {
  title: "Feature usage",
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminUsagePage() {
  await requireAdminUser();

  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);

  const [rows7d, todayCount] = await Promise.all([
    countEventsByActionStatus(sevenDaysAgo),
    countEventsSince(todayStart),
  ]);

  const breakdown = buildActionBreakdown(rows7d);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature usage"
        description="What people are actually doing with AI-backed features, last 7 days."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <MetricCard label="Today" value={todayCount} hint="events so far" />
        <MetricCard
          label="Most used"
          value={mostUsedActionLabel(breakdown)}
          hint="last 7 days"
        />
        <MetricCard
          label="Failure rate"
          value={`${Math.round(failureRate(breakdown) * 100)}%`}
          hint="last 7 days"
          trend={failureRate(breakdown) > 0.1 ? "down" : "flat"}
        />
      </div>

      {breakdown.length === 0 ? (
        <EmptyState
          title="No AI activity yet"
          description="Usage shows up here once people start using AI-backed features."
        />
      ) : (
        <UsageBreakdownTable rows={breakdown} />
      )}
    </div>
  );
}
