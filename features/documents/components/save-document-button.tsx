"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
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
  alreadySaved,
}: {
  applicationPublicId: string;
  view: AiView;
  alreadySaved: boolean;
}) {
  const [state, action] = useActionState(
    saveAnalysisViewAction,
    initialDocumentFormState,
  );
  const announced = useRef(initialDocumentFormState);

  useEffect(() => {
    if (state === announced.current || state.status === "idle") {
      return;
    }

    announced.current = state;

    if (state.status === "error") {
      notify.error(state.message);
    } else {
      notify.success(state.message);
    }
  }, [state]);

  if (alreadySaved || state.status === "saved") {
    return (
      <Button type="button" size="compact" variant="outline" disabled>
        <Check className="size-4" aria-hidden />
        Saved to AI Documents
      </Button>
    );
  }

  return (
    <form action={action}>
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
