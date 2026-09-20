"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";

export function AdminInlineActionButton({
  action,
  publicId,
  label,
  pendingLabel = "Working...",
  successMessage,
  fieldName = "publicId",
}: {
  action: (formData: FormData) => Promise<void>;
  publicId: string;
  label: string;
  pendingLabel?: string;
  successMessage: string;
  fieldName?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="compact"
      disabled={pending}
      onClick={() => {
        const formData = new FormData();
        formData.set(fieldName, publicId);

        startTransition(async () => {
          try {
            await action(formData);
            notify.success(successMessage);
          } catch (error) {
            notify.error(
              error instanceof Error
                ? error.message
                : "That action could not be completed.",
            );
          }
        });
      }}
    >
      {pending ? pendingLabel : label}
    </Button>
  );
}
