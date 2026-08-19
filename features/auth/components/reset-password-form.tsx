"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { initialPasswordFormState } from "@/features/auth/actions/password-form-state";
import { resetPasswordAction } from "@/features/auth/actions/password-reset-actions";
import { PasswordRequirements } from "@/features/auth/components/password-requirements";
import { unmetPasswordRules } from "@/features/auth/schemas/password-rules";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" block disabled={pending}>
      {pending ? "Saving…" : "Save new password"}
    </Button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(
    resetPasswordAction,
    initialPasswordFormState,
  );
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const field = formRef.current?.elements.namedItem("password");

    if (field instanceof HTMLInputElement) {
      setPassword(field.value);
    }
  }, [state]);

  const highlightUnmet =
    unmetPasswordRules(password).length > 0 &&
    (passwordTouched || state.status === "error");

  if (state.status === "saved") {
    return (
      <div className="space-y-4">
        <Alert tone="success">{state.message}</Alert>
        <Button asChild size="primary" block>
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          aria-describedby="reset-password-hint"
          aria-invalid={highlightUnmet}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setPasswordTouched(true)}
        />
        <PasswordRequirements
          id="reset-password-hint"
          value={password}
          highlightUnmet={highlightUnmet}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
