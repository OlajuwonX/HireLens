import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getAccountRecord } from "@/features/auth/server/current-account";
import { getImpersonationBannerData } from "@/features/auth/server/impersonation";
import { requireRealDatabaseUser } from "@/features/auth/server/require-database-user";
import { requireCurrentUser } from "@/features/auth/server/require-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, account } = await requireCurrentUser();
  const realUser = await requireRealDatabaseUser();
  const [record, impersonation] = await Promise.all([
    getAccountRecord(realUser.id),
    getImpersonationBannerData(),
  ]);

  return (
    <AppShell
      isAdmin={record?.role === "ADMIN"}
      impersonation={impersonation}
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
    </AppShell>
  );
}
