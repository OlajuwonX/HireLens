import { cn } from "@/lib/utils";
import * as React from "react";

export function PageContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-page", className)} {...props} />
  );
}
