"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { AiView } from "@/features/analyses/server/analysis.mapper";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="compact" disabled={pending}>
      {pending ? "Saving..." : "Save to AI Documents"}
    </Button>
  );
}

export function SaveDocumentButton({
  applicationPublicId,
  view,
  alreadySaved,
  action,
  onOptimisticSave,
}: {
  applicationPublicId: string;
  view: AiView;
  alreadySaved: boolean;
  action: (formData: FormData) => void;
  onOptimisticSave: () => void;
}) {
  if (alreadySaved) {
    return (
      <Button type="button" size="compact" variant="outline" disabled>
        Saved to AI Documents
      </Button>
    );
  }

  return (
    <form action={action} onSubmit={onOptimisticSave}>
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
