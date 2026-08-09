"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateDocumentAction } from "../actions/document-actions";
import { initialDocumentFormState } from "../actions/document-form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="primary" disabled={pending}>
      {pending ? "Saving..." : "Save edits"}
    </Button>
  );
}

export function DocumentEditForm({
  publicId,
  content,
}: {
  publicId: string;
  content: string;
}) {
  const [state, formAction] = useActionState(
    updateDocumentAction,
    initialDocumentFormState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="publicId" value={publicId} />
      <div className="space-y-1.5">
        <Label htmlFor="editedContent">Editable document</Label>
        <Textarea
          id="editedContent"
          name="editedContent"
          rows={18}
          maxLength={50_000}
          defaultValue={content}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        {state.status !== "idle" ? (
          <p
            role="status"
            className={
              state.status === "error"
                ? "text-meta text-danger"
                : "text-meta text-text-secondary"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
