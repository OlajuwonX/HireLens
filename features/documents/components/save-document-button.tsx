"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiView } from "@/features/analyses/server/analysis.mapper";
import { saveAnalysisViewAction } from "../actions/document-actions";
import { initialDocumentFormState } from "../actions/document-form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="compact" disabled={pending}>
      <Save className="size-4" aria-hidden />
      {pending ? "Saving..." : "Save to AI Documents"}
    </Button>
  );
}

export function SaveDocumentButton({
  applicationPublicId,
  view,
}: {
  applicationPublicId: string;
  view: AiView;
}) {
  const [state, action] = useActionState(
    saveAnalysisViewAction,
    initialDocumentFormState,
  );

  return (
    <form action={action} className="flex items-center gap-3">
      {state.status !== "idle" ? (
        <span
          className={
            state.status === "error"
              ? "text-label text-danger"
              : "text-label text-text-secondary"
          }
        >
          {state.message}
        </span>
      ) : null}
      <input type="hidden" name="view" value={view} />
      <input
        type="hidden"
        name="applicationPublicId"
        value={applicationPublicId}
      />
      <SubmitButton />
    </form>
  );
}
