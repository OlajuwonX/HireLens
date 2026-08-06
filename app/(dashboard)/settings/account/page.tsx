import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireCurrentUser } from "@/features/auth/server/require-user";

export const metadata: Metadata = {
  title: "Account settings",
};

export default async function AccountSettingsPage() {
  const { user, account } = await requireCurrentUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account settings"
        description="Review the safe public account information available to the application."
      />
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-950">Profile</h2>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>Name: {user.name ?? "Not provided"}</p>
          <p>Email: {user.email ?? "Not provided"}</p>
          <p>
            Onboarding: {account.onboardingCompleted ? "Complete" : "Pending"}
          </p>
          <p>Last login: {account.lastLoginAt ?? "Not recorded"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
