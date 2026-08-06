import * as React from "react";
import { cn } from "@/lib/utils";

export function MobileNavigation({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <nav className={cn("lg:hidden", className)} aria-label="Mobile navigation" {...props} />;
}
