import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireVerifiedDatabaseUser } from "@/features/auth/server/require-database-user";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account settings",
};

export default async function AccountSettingsPage() {
  const user = await requireVerifiedDatabaseUser();
  const hasPassword = Boolean(user.passwordHash);

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Dashboard" />

      <PageHeader
        title="Account settings"
        description="Your profile and the ways you can sign in to HireLens."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-meta text-text-secondary">
          <p>Name: {user.name ?? "Not provided"}</p>
          <p>Email: {user.email}</p>
          <p>Email verified: {user.emailVerifiedAt ? "Yes" : "Not yet"}</p>
          <p>
            Last sign-in:{" "}
            {user.lastLoginAt
              ? user.lastLoginAt.toLocaleString()
              : "Not recorded"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Sign-in methods</CardTitle>
          <Badge tone={hasPassword ? "green" : "neutral"}>
            {hasPassword ? "Password set" : "Google only"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-meta text-text-secondary">
            {hasPassword
              ? "You can sign in with your email and password, or with Google using the same email address."
              : "You currently sign in with Google. There is no password on this account."}
          </p>

          {hasPassword ? null : (
            <Alert tone="info">
              If you previously set a password and it is no longer listed here,
              it was removed when Google confirmed you own this email address. A
              password set before the address was verified cannot be trusted, so
              HireLens clears it. You can keep signing in with Google, and set a
              new password once password resets are available.
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
