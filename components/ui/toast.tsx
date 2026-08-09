import * as React from "react";
import { cn } from "@/lib/utils";

export function Toast({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-card border border-border bg-surface px-4 py-3 text-meta text-text-primary shadow-lg",
        className,
      )}
      {...props}
    />
  );
}
