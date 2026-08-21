import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmEmailForm } from "@/features/auth/components/confirm-email-form";
import { isVerificationTokenUsable } from "@/features/auth/server/email-verification.service";
import { isEmailEnabled } from "@/lib/email/brevo";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Confirm your email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  if (!isEmailEnabled()) {
    redirect("/dashboard");
  }

  const { token } = await searchParams;
  const usable = token ? await isVerificationTokenUsable(token) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-semibold text-text-primary">
          Confirm your email
        </h1>
        {usable ? (
          <p className="mt-1.5 text-meta text-text-secondary">
            Confirming keeps your password on this account for good, so you can
            sign in with either your password or Google.
          </p>
        ) : null}
      </div>

      {usable && token ? (
        <ConfirmEmailForm token={token} />
      ) : (
        <div className="space-y-4">
          <Alert tone="error">
            This confirmation link has expired or has already been used. You can
            send yourself a new one from account settings.
          </Alert>
          <Button asChild size="primary" block>
            <Link href="/settings/account">Go to account settings</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
