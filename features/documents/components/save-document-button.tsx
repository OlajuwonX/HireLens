"use client";

import { useFormStatus } from "react-dom";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiView } from "@/features/analyses/server/analysis.mapper";

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
        <Check className="size-4" aria-hidden />
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
