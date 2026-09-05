import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPurgeDate } from "@/features/account/constants";
import { RestoreAccountForm } from "@/features/account/components/restore-account-form";
import { getAccountOverview } from "@/features/account/server/account.service";
import { blockedAccountRoute } from "@/features/auth/account-state";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireSessionUserId } from "@/features/auth/server/require-database-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Account scheduled for deletion",
  robots: { index: false, follow: false },
};

export default async function AccountScheduledPage() {
  const account = await getAccountOverview(await requireSessionUserId());

  if (!account) {
    redirect("/sign-in");
  }

  if (account.state !== "DELETION_PENDING") {
    redirect(blockedAccountRoute(account.state) ?? "/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your account is scheduled for deletion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-meta text-text-secondary">
        <Alert tone="warning">
          Your account is closed and the dashboard is no longer available.
          {account.purgeAfter ? (
            <>
              {" "}
              Everything will be permanently deleted on{" "}
              <strong>{formatPurgeDate(account.purgeAfter)}</strong>.
            </>
          ) : null}
        </Alert>
        <p>
          Your resumes, saved jobs, applications, documents and uploaded files
          are still stored until that date. Once they are removed they cannot be
          recovered.
        </p>
        <p>
          If you did not request this, or you have changed your mind, restore
          the account now.
        </p>

        <RestoreAccountForm />

        <div className="border-t border-border pt-4">
          <SignOutButton />
        </div>
      </CardContent>
    </Card>
  );
}
