import * as React from "react";
import { cn } from "@/lib/utils";

export function DashboardSidebar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <nav className={cn("space-y-1", className)} aria-label="Dashboard" {...props} />;
}
