"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/toast";
import { renameResumeAction } from "@/features/resumes/actions/resume-actions";
import { initialRenameResumeState } from "@/features/resumes/actions/resume-form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="sm:shrink-0"
    >
      {pending ? "Saving…" : "Rename"}
    </Button>
  );
}

export function RenameResumeForm({
  publicId,
  title,
  onSuccess,
}: {
  publicId: string;
  title: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(
    renameResumeAction,
    initialRenameResumeState,
  );
  const announced = useRef(initialRenameResumeState);

  useEffect(() => {
    if (state === announced.current || state.status === "idle") {
      return;
    }

    announced.current = state;

    if (state.status === "error") {
      notify.error(state.message);
      return;
    }

    notify.success(state.message);
    onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="publicId" value={publicId} />
      <Label htmlFor="title">Rename job title</Label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="title"
          name="title"
          defaultValue={title}
          required
          maxLength={120}
        />
        <SubmitButton />
      </div>
    </form>
  );
}
