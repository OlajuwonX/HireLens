import * as React from "react";
import { cn } from "@/lib/utils";

export function DetailsPanel({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <aside className={cn("rounded-lg border border-gray-200 bg-white p-4", className)} {...props} />;
}
