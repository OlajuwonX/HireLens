"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialPasswordFormState } from "@/features/auth/actions/password-form-state";
import { requestPasswordResetAction } from "@/features/auth/actions/password-reset-actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" block disabled={pending}>
      {pending ? "Sending…" : "Email me a reset link"}
    </Button>
  );
}

export function RequestResetForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialPasswordFormState,
  );

  if (state.status === "saved") {
    return <Alert tone="success">{state.message}</Alert>;
  }

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

      <SubmitButton />
    </form>
  );
}
