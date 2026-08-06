import * as React from "react";
import { cn } from "@/lib/utils";

export function Timeline({ className, ...props }: React.OlHTMLAttributes<HTMLOListElement>) {
  return <ol className={cn("space-y-4", className)} {...props} />;
}
