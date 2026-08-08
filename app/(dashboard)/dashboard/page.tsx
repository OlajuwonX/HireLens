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
        description="Here's where your job search stands."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Onboarding"
          value={profile.account.onboardingCompleted ? "Complete" : "Pending"}
        />
        <MetricCard
          label="Last sign-in"
          value={
            profile.account.lastLoginAt
              ? new Date(profile.account.lastLoginAt).toLocaleDateString()
              : "Not recorded"
          }
        />
      </div>
      <EmptyState
        title="Start with a resume"
        description="Upload a resume to run an ATS and quality analysis against it."
      />
    </div>
  );
}
