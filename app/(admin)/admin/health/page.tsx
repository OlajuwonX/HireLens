import type { Metadata } from "next";
import { MetricCard } from "@/components/data-display/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdminUser } from "@/features/admin/server/require-admin";
import {
  checkDatabase,
  countActiveAiReservations,
  countPendingInterviewPools,
  countRecentErrors,
} from "@/features/admin/server/system-health.service";

export const metadata: Metadata = {
  title: "System health",
};

export default async function AdminHealthPage() {
  await requireAdminUser();

  const [database, pendingPools, activeReservations, recentErrors] =
    await Promise.all([
      checkDatabase(),
      countPendingInterviewPools(),
      countActiveAiReservations(),
      countRecentErrors(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="System health"
        description="An at-a-glance operational status check."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Database"
          value={database.reachable ? "Reachable" : "Unreachable"}
          hint={
            database.reachable
              ? `${database.latencyMs}ms`
              : "Query timed out or failed"
          }
          trend={database.reachable ? "flat" : "down"}
        />
        <MetricCard
          label="Pending interview pools"
          value={pendingPools}
          hint="generating right now"
        />
        <MetricCard
          label="Active AI reservations"
          value={activeReservations}
          hint="in-flight requests"
        />
        <MetricCard
          label="Recent errors"
          value={recentErrors}
          hint="last 24 hours"
          trend={recentErrors > 0 ? "down" : "flat"}
        />
      </div>
    </div>
  );
}
