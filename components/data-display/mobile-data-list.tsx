import * as React from "react";
import { cn } from "@/lib/utils";

export function MobileDataList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("divide-y divide-border rounded-card border border-border bg-surface", className)} {...props} />;
}
