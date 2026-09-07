import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactivateAccountForm } from "@/features/account/components/reactivate-account-form";
import { getAccountOverview } from "@/features/account/server/account.service";
import { blockedAccountRoute } from "@/features/auth/account-state";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireSessionUserId } from "@/features/auth/server/require-database-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Account paused",
  robots: { index: false, follow: false },
};

export default async function AccountPausedPage() {
  const account = await getAccountOverview(await requireSessionUserId());

  if (!account) {
    redirect("/sign-in");
  }

  if (account.state !== "DISABLED") {
    redirect(blockedAccountRoute(account.state) ?? "/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your account is paused</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-meta text-text-secondary">
        <p>
          HireLens is on hold for this account, so the dashboard is unavailable
          for now.
        </p>
        <p>
          Nothing has been deleted. Your resumes, saved jobs, applications and
          documents are all still here, exactly as you left them, and they stay
          that way until you reactivate.
        </p>

        <ReactivateAccountForm />

        <div className="border-t border-border pt-4">
          <SignOutButton />
        </div>
      </CardContent>
    </Card>
  );
}
