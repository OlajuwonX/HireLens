"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { notify } from "@/components/ui/toast";
import { initialPasswordFormState } from "@/features/auth/actions/password-form-state";
import { resetPasswordAction } from "@/features/auth/actions/password-reset-actions";
import { PasswordRequirements } from "@/features/auth/components/password-requirements";
import { unmetPasswordRules } from "@/features/auth/schemas/password-rules";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [state, formAction] = useActionState(
    resetPasswordAction,
    initialPasswordFormState,
  );
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const handled = useRef(initialPasswordFormState);

  useEffect(() => {
    if (state === handled.current || state.status === "idle") {
      return;
    }

    handled.current = state;

    if (state.status === "error") {
      notify.error(state.message);
      return;
    }

    notify.success(state.message);
    router.push("/sign-in");
  }, [state, router]);

  const highlightUnmet =
    unmetPasswordRules(password).length > 0 && passwordTouched;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

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
