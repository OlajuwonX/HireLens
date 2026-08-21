import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordDialog } from "@/features/auth/components/password-dialog";
import { VerifyEmailButton } from "@/features/auth/components/verify-email-button";
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

          {hasPassword && !user.emailVerifiedAt ? (
            <Alert tone="warning">
              Your email address is not confirmed yet. If you sign in with
              Google before confirming it, HireLens removes this password,
              because a password set on an unconfirmed address cannot be
              trusted. Confirm the address to keep both ways of signing in.
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-border pt-4">
            <PasswordDialog hasPassword={hasPassword} />
            {user.emailVerifiedAt ? null : <VerifyEmailButton />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
