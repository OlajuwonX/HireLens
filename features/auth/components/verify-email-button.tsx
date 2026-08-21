"use client";

import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { requestEmailVerificationAction } from "@/features/auth/actions/email-verification-actions";
import { initialPasswordFormState } from "@/features/auth/actions/password-form-state";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="primary" disabled={pending}>
      {pending ? "Sending…" : "Send confirmation link"}
    </Button>
  );
}

export function VerifyEmailButton() {
  const [state, formAction] = useActionState(
    requestEmailVerificationAction,
    initialPasswordFormState,
  );
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
  }, [state]);

  return (
    <form action={formAction}>
      <SubmitButton />
    </form>
  );
}
