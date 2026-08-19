import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { isResetTokenUsable } from "@/features/auth/server/password-reset.service";
import { isEmailEnabled } from "@/lib/email/brevo";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Choose a new password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  if (!isEmailEnabled()) {
    redirect("/forgot-password");
  }

  const { token } = await searchParams;
  const usable = token ? await isResetTokenUsable(token) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-semibold text-text-primary">
          Choose a new password
        </h1>
        {usable ? (
          <p className="mt-1.5 text-meta text-text-secondary">
            Pick something you have not used on HireLens before.
          </p>
        ) : null}
      </div>

      {usable && token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <Alert tone="error">
            This reset link has expired or has already been used. Reset links
            last 30 minutes and work once.
          </Alert>
          <Button asChild size="primary" block>
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      )}

      <p className="flex flex-col items-center justify-center gap-1 text-center text-meta text-text-secondary sm:flex-row sm:flex-wrap sm:gap-x-1.5">
        <span>Remembered it?</span>
        <Link
          href="/sign-in"
          className="font-medium text-text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
