import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: number }) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-100", className)}
      {...props}
    >
      <div className="h-full bg-green-500 transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
