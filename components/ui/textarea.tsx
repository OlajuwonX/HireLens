import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "field-sizing-content min-h-24 w-full resize-y rounded-control border border-border bg-surface px-3 py-2 text-body text-text-primary transition-colors",
        "placeholder:text-text-muted",
        "hover:border-border-strong",
        "focus:border-accent-hover focus:outline-none focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  );
}
