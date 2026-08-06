import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/data-display/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { syncUserProfile } from "@/features/auth/server/profile-sync";
import { requireCurrentUser } from "@/features/auth/server/require-user";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const currentUser = await requireCurrentUser();
  const profile = await syncUserProfile(currentUser);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Your authenticated HireLens workspace is ready for resume, job, and application features."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="Profile persistence" value={profile.persistence} />
        <MetricCard
          label="Onboarding"
          value={profile.account.onboardingCompleted ? "Complete" : "Pending"}
        />
        <MetricCard
          label="Last login"
          value={profile.account.lastLoginAt ? "Recorded" : "Not recorded"}
        />
      </div>
      <EmptyState
        title="Resume workspace coming next"
        description="Stage 4 adds the database layer that will persist users, resumes, jobs, and application data."
      />
    </div>
  );
}
