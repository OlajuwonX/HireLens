import { AppShell } from "@/components/layout/app-shell";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { PageContainer } from "@/components/layout/page-container";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireCurrentUser } from "@/features/auth/server/require-user";

const navigation = [
  { label: "Overview", href: "/dashboard" },
  { label: "Account", href: "/settings/account" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireCurrentUser();

  return (
    <AppShell
      header={
        <DashboardHeader>
          <PageContainer className="flex items-center justify-between py-4">
            <div>
              <p className="text-lg font-semibold text-gray-950">HireLens</p>
              <p className="text-sm text-gray-600">
                {currentUser.user.email ?? "Signed in"}
              </p>
            </div>
            <SignOutButton />
          </PageContainer>
        </DashboardHeader>
      }
      sidebar={
        <DashboardSidebar>
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </a>
          ))}
        </DashboardSidebar>
      }
    >
      {children}
    </AppShell>
  );
}
