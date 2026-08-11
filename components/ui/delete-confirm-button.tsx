"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition, type ComponentType } from "react";
import { Button, IconButton } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function DeleteConfirmButton({
  action,
  publicId,
  title,
  description,
  confirmLabel = "Delete",
  fieldName = "publicId",
  toastLabel,
  icon: Icon = Trash2,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  publicId: string;
  title: string;
  description: string;
  confirmLabel?: string;
  fieldName?: string;
  toastLabel?: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [pending, startTransition] = useTransition();

  if (removed) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <IconButton
          label={confirmLabel}
          variant="danger"
          className={cn("rounded-none", className)}
        >
          <Icon className="size-4" aria-hidden />
        </IconButton>
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
              setOpen(false);
              setRemoved(true);

              startTransition(async () => {
                try {
                  await action(formData);

                  if (toastLabel) {
                    notify.deleted(toastLabel);
                  }
                } catch (error) {
                  if (
                    error instanceof Error &&
                    error.message.includes("NEXT_REDIRECT")
                  ) {
                    return;
                  }

                  setRemoved(false);
                  notify.error(
                    toastLabel
                      ? `${toastLabel} could not be deleted.`
                      : "That item could not be deleted.",
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
