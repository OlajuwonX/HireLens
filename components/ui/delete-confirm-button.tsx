"use client";

import type { ComponentType } from "react";
import { Trash2 } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteConfirmButton({
  action,
  publicId,
  title,
  description,
  confirmLabel = "Delete",
  icon: Icon = Trash2,
}: {
  action: (formData: FormData) => void | Promise<void>;
  publicId: string;
  title: string;
  description: string;
  confirmLabel?: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <IconButton
          label={confirmLabel}
          variant="danger"
          className="rounded-none bg-danger text-white hover:bg-danger/90"
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
        <form action={action} className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <input type="hidden" name="publicId" value={publicId} />
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" variant="danger">
            {confirmLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
