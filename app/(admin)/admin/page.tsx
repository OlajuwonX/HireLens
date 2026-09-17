import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { adminNavigation } from "@/components/layout/navigation";
import { requireAdminUser } from "@/features/admin/server/require-admin";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administration",
};

export default async function AdminPage() {
  await requireAdminUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration"
        description="Operational tools for running HireLens. More sections land here as they ship."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {adminNavigation.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full transition-colors hover:bg-surface-elevated">
              <CardHeader className="flex flex-row items-center gap-3">
                <item.Icon aria-hidden="true" className="size-5 shrink-0" />
                <CardTitle>{item.label}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
