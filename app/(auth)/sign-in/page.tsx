import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getCurrentUser } from "@/features/auth/server/current-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to HireLens with Google.",
};

export default async function SignInPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-950">
          Sign in to HireLens
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Use your Google account to access your resume workspace.
        </p>
        <div className="mt-6">
          <SignInForm />
        </div>
      </section>
    </main>
  );
}
