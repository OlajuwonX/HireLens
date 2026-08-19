"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { setAccountPasswordAction } from "@/features/auth/actions/password-actions";
import { initialPasswordFormState } from "@/features/auth/actions/password-form-state";
import { PasswordRequirements } from "@/features/auth/components/password-requirements";
import { unmetPasswordRules } from "@/features/auth/schemas/password-rules";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ hasPassword }: { hasPassword: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" disabled={pending}>
      {pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}
    </Button>
  );
}

export function SetPasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction] = useActionState(
    setAccountPasswordAction,
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

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      {state.status === "saved" ? (
        <Alert tone="success">{state.message}</Alert>
      ) : null}

      {hasPassword ? (
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            autoComplete="current-password"
            required
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="password">
          {hasPassword ? "New password" : "Password"}
        </Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          aria-describedby="account-password-hint"
          aria-invalid={highlightUnmet}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setPasswordTouched(true)}
        />
        <PasswordRequirements
          id="account-password-hint"
          value={password}
          highlightUnmet={highlightUnmet}
        />
      </div>

      <SubmitButton hasPassword={hasPassword} />
    </form>
  );
}
