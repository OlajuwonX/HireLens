import { MetricCard } from "@/components/data-display/metric-card";
import { PageTitle } from "@/components/layout/page-title";
import { EmptyState } from "@/components/ui/empty-state";
import { requireCurrentUser } from "@/features/auth/server/require-user";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview",
};

function greeting(name: string | null) {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = name?.trim().split(/\s+/)[0];

  return first ? `${part}, ${first}.` : `${part}.`;
}

export default async function DashboardPage() {
  const { user } = await requireCurrentUser();

  return (
    <div className="space-y-6">
      <PageTitle title="Overview" />

      <div>
        <p className="text-page-title font-semibold text-text-primary">
          {greeting(user.name)}
        </p>
        <p className="mt-1 text-meta text-text-secondary">
          Here&rsquo;s where your job search stands.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active" value="00" hint="No applications yet" />
        <MetricCard label="Saved Jobs" value="00" hint="Nothing saved yet" />
        <MetricCard label="Avg Job Fit" value="—" hint="Run an analysis" />
        <MetricCard label="Follow-ups" value="00" hint="None due" />
      </div>

      <EmptyState
        title="Start with a resume"
        description="Upload a resume to run an ATS and quality analysis against it."
      />
    </div>
  );
}
