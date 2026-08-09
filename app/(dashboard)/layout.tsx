import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireCurrentUser } from "@/features/auth/server/require-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, account } = await requireCurrentUser();

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
    </AppShell>
  );
}
