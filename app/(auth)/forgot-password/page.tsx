import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { GoogleButton } from "@/features/auth/components/google-button";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-semibold text-text-primary">
          Forgotten your password?
        </h1>
        <p className="mt-1.5 text-meta text-text-secondary">
          If your HireLens email is a Google account, you can get straight back
          in.
        </p>
      </div>

      <div className="space-y-3 rounded-card border border-border bg-surface p-5">
        <h2 className="text-section-title font-semibold text-text-primary">
          Sign in with Google instead
        </h2>
        <p className="text-meta text-text-secondary">
          HireLens matches your account by email address. If you sign in with
          Google using the same email you signed up with, you will land in your
          existing account with all of your resumes and analyses. Your password
          is not needed for this.
        </p>
        <GoogleButton />
      </div>

      <Alert tone="info">
        Email-based password resets are not available yet. If your HireLens
        email is not a Google account, contact support to recover access.
      </Alert>

      <p className="text-meta text-text-secondary">
        Remembered it?{" "}
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
