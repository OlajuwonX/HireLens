import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getAccountRecord } from "@/features/auth/server/current-account";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { requireCurrentUser } from "@/features/auth/server/require-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, account } = await requireCurrentUser();
  const databaseUser = await requireDatabaseUser();
  const record = await getAccountRecord(databaseUser.id);

  return (
    <AppShell
      isAdmin={record?.role === "ADMIN"}
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
