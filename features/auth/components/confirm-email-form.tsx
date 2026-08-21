"use client";

import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { confirmEmailAction } from "@/features/auth/actions/email-verification-actions";
import { initialPasswordFormState } from "@/features/auth/actions/password-form-state";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" block disabled={pending}>
      {pending ? "Confirming…" : "Confirm this address"}
    </Button>
  );
}

export function ConfirmEmailForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    confirmEmailAction,
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
    router.push("/dashboard");
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <SubmitButton />
    </form>
  );
}
