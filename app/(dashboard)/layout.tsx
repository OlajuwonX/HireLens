import { AppShell } from "@/components/layout/app-shell";
import { PageContainer } from "@/components/layout/page-container";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireCurrentUser } from "@/features/auth/server/require-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireCurrentUser();

  return (
    <AppShell
      headerRight={<ThemeToggle />}
      sidebarFooter={
        <div className="space-y-3">
          <div className="min-w-0">
            <p className="truncate text-label font-medium text-text-primary">
              {currentUser.user.name ?? "Signed in"}
            </p>
            <p className="truncate font-mono text-system text-text-muted">
              {currentUser.user.email ?? ""}
            </p>
          </div>
          <SignOutButton />
        </div>
      }
    >
      <PageContainer>{children}</PageContainer>
    </AppShell>
  );
}
