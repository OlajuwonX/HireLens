import { cn } from "@/lib/utils";
import * as React from "react";

export function DetailsPanel({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <aside
      className={cn(
        "rounded-card border border-border bg-surface p-4",
        className,
      )}
      {...props}
    />
  );
}
