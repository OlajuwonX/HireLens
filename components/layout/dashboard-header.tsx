import * as React from "react";
import { cn } from "@/lib/utils";

export function DashboardHeader({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <header className={cn("border-b border-gray-200 bg-white", className)} {...props} />;
}
