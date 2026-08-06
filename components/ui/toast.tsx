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
        "rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-lg",
        className,
      )}
      {...props}
    />
  );
}
