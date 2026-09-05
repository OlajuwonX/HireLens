"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { reactivateAccountAction } from "@/features/account/actions/account-actions";
import { initialAccountFormState } from "@/features/account/actions/account-form-state";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" block disabled={pending}>
      {pending ? "Reactivating…" : "Reactivate my account"}
    </Button>
  );
}

export function ReactivateAccountForm() {
  const [state, formAction] = useActionState(
    reactivateAccountAction,
    initialAccountFormState,
  );

  return (
    <form action={formAction} className="space-y-3">
      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}
      <SubmitButton />
    </form>
  );
}
