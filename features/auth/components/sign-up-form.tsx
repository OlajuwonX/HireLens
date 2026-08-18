"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { signUpWithCredentials } from "@/features/auth/actions/auth-actions";
import { initialAuthFormState } from "@/features/auth/actions/auth-form-state";
import { PasswordRequirements } from "@/features/auth/components/password-requirements";
import { unmetPasswordRules } from "@/features/auth/schemas/password-rules";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" block disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState(
    signUpWithCredentials,
    initialAuthFormState,
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

      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          maxLength={120}
        />
      </div>

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
          autoComplete="new-password"
          required
          aria-describedby="password-hint"
          aria-invalid={highlightUnmet}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setPasswordTouched(true)}
        />
        <PasswordRequirements
          id="password-hint"
          value={password}
          highlightUnmet={highlightUnmet}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
