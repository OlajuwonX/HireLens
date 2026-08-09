import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthDivider } from "@/features/auth/components/auth-divider";
import { GoogleButton } from "@/features/auth/components/google-button";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getCurrentUser } from "@/features/auth/server/current-user";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage() {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-semibold text-text-primary">
          Welcome back
        </h1>
        <p className="mt-1.5 text-meta text-text-secondary">
          Sign in to pick up your job search where you left off.
        </p>
      </div>

      <SignInForm />

      <AuthDivider />

      <GoogleButton />

      <p className="text-meta text-text-secondary">
        New to HireLens?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-text-primary underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
