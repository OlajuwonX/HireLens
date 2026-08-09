import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-elevated text-meta font-semibold text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}
