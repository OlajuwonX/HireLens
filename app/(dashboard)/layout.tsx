import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { requireCurrentUser } from "@/features/auth/server/require-user";
import { OnboardingTour } from "@/features/onboarding/components/onboarding-tour";
import { getOnboardingProgress } from "@/features/onboarding/server/onboarding.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, account } = await requireCurrentUser();
  const databaseUser = await requireDatabaseUser();
  const onboarding = await getOnboardingProgress(databaseUser.id);

  return (
    <AppShell
      sidebarFooter={
        <ProfileMenu
          name={user.name}
          email={user.email}
          lastLoginAt={account.lastLoginAt}
          signOutSlot={<SignOutButton />}
        />
      }
    >
      <PageContainer>{children}</PageContainer>
      {onboarding ? <OnboardingTour progress={onboarding} /> : null}
    </AppShell>
  );
}
