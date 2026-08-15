import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthDivider } from "@/features/auth/components/auth-divider";
import { GoogleButton } from "@/features/auth/components/google-button";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { getCurrentUser } from "@/features/auth/server/current-user";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function SignUpPage() {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title font-semibold text-text-primary">
          Create your workspace
        </h1>
        <p className="mt-1.5 text-meta text-text-secondary">
          Prepare stronger applications and keep your job search organized in
          one place.
        </p>
      </div>

      <SignUpForm />

      <AuthDivider />

      <GoogleButton />

      <p className="flex flex-col items-center justify-center gap-1 text-center text-meta text-text-secondary sm:flex-row sm:flex-wrap sm:gap-x-1.5">
        <span>Already have an account?</span>
        <Link
          href="/sign-in"
          className="font-medium text-text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
