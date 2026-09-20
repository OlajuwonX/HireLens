"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";

export function AdminConfirmActionButton({
  action,
  publicId,
  label,
  title,
  description,
  confirmLabel,
  successMessage,
  fieldName = "publicId",
}: {
  action: (formData: FormData) => Promise<void>;
  publicId: string;
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  fieldName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="compact">
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-border">
        <div className="space-y-2 pr-8">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            {title}
          </DialogTitle>
          <DialogDescription className="text-meta leading-relaxed text-text-secondary">
            {description}
          </DialogDescription>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() => {
              const formData = new FormData();
              formData.set(fieldName, publicId);

              startTransition(async () => {
                try {
                  await action(formData);
                  setOpen(false);
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
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
