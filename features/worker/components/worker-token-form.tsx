"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { CopyContentButton } from "@/features/documents/components/ai-document-modal";
import { useActionToast } from "@/lib/forms/use-action-toast";
import { createWorkerTokenAction, type TokenFormState } from "../actions/token-actions";

const initial: TokenFormState = { status: "idle", message: "" };

function CreateButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create token"}
    </Button>
  );
}

export function WorkerTokenForm() {
  const [state, action] = useActionState(createWorkerTokenAction, initial);

  useActionToast(state);

  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <FormField id="worker-name" label="Computer name" hint="So you can tell your tokens apart.">
          <Input id="worker-name" name="name" maxLength={60} placeholder="My laptop" required />
        </FormField>
        <CreateButton />
      </form>

      {state.token ? (
        <Alert tone="warning">
          <div className="space-y-2">
            <p>Copy this token into your worker&apos;s .env file now. It will not be shown again.</p>
            <code className="block break-all bg-surface-secondary p-2 font-mono text-label">{state.token}</code>
            <CopyContentButton content={state.token} label="Worker token" />
          </div>
        </Alert>
      ) : null}
    </div>
  );
}
