import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getAccountRecord } from "@/features/auth/server/current-account";
import { getImpersonationBannerData } from "@/features/auth/server/impersonation";
import {
  requireDatabaseUser,
  requireRealDatabaseUser,
} from "@/features/auth/server/require-database-user";
import { requireCurrentUser } from "@/features/auth/server/require-user";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { getUnreadNotificationCount } from "@/features/notifications/server/notification.service";
import { OnboardingTour } from "@/features/onboarding/components/onboarding-tour";
import { getOnboardingProgress } from "@/features/onboarding/server/onboarding.service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, account } = await requireCurrentUser();
  const databaseUser = await requireDatabaseUser();
  const realUser = await requireRealDatabaseUser();
  const [onboarding, unreadCount, realRecord, impersonation] =
    await Promise.all([
      getOnboardingProgress(databaseUser.id),
      getUnreadNotificationCount(databaseUser.id),
      getAccountRecord(realUser.id),
      getImpersonationBannerData(),
    ]);

  return (
    <AppShell
      isAdmin={realRecord?.role === "ADMIN"}
      impersonation={impersonation}
      headerSlot={<NotificationBell unreadCount={unreadCount} />}
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
