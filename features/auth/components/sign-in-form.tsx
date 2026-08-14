"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { signInWithCredentials } from "@/features/auth/actions/auth-actions";
import { initialAuthFormState } from "@/features/auth/actions/auth-form-state";
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="primary" block disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}
export function SignInForm() {
  const [state, formAction] = useActionState(
    signInWithCredentials,
    initialAuthFormState,
  );
  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
        />
      </div>
      <SubmitButton />
      <Link
        href="/forgot-password"
        className="block text-label text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
      >
        Forgot password?
      </Link>
    </form>
  );
}
