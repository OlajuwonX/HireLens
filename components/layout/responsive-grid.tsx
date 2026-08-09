import { cn } from "@/lib/utils";
import * as React from "react";

export function ResponsiveGrid({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    />
  );
}
