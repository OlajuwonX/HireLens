import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-semibold text-gray-700",
        className,
      )}
      {...props}
    />
  );
}
