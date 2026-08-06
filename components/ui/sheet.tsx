"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccessibleIconButton } from "./accessible-icon-button";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: DialogPrimitive.DialogContentProps & { side?: "left" | "right" }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-0 z-50 h-dvh w-[min(24rem,100vw)] overflow-auto bg-white p-6 shadow-xl",
          side === "left" ? "left-0" : "right-0",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close asChild>
          <AccessibleIconButton
            label="Close panel"
            icon={<X className="size-4" aria-hidden="true" />}
            variant="ghost"
            className="absolute right-3 top-3"
          />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;
