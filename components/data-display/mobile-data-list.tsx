import * as React from "react";
import { cn } from "@/lib/utils";

export function MobileDataList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white", className)} {...props} />;
}
