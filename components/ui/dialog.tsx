"use client";

import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AccessibleIconButton } from "./accessible-icon-button";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DialogContent({
  className,
  children,
  onOpenAutoFocus,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-card bg-surface p-6 shadow-xl focus-visible:outline-none [&.p-0>[data-dialog-close]]:m-0",
          className,
        )}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);

          if (event.defaultPrevented) {
            return;
          }

          // The close button comes first in the DOM so it can stay pinned
          // while the dialog scrolls; start focus on the dialog's own content.
          const content = event.currentTarget as HTMLElement | null;
          const first = Array.from(
            content?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
          ).find((element) => !element.closest("[data-dialog-close]"));

          if (first) {
            event.preventDefault();
            first.focus();
          }
        }}
        {...props}
      >
        <div
          data-dialog-close
          className="pointer-events-none sticky top-0 z-10 -mx-6 -mt-6 mb-6 h-0"
        >
          <DialogPrimitive.Close asChild>
            <AccessibleIconButton
              label="Close dialog"
              icon={<X className="size-4" aria-hidden="true" />}
              variant="ghost"
              className="pointer-events-auto absolute right-3 top-3"
            />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
