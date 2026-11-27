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
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-none bg-surface-elevated",
        className,
      )}
      {...props}
    >
      <div
        className="h-full w-full origin-left bg-accent transition-transform duration-700 ease-out"
        style={{ transform: `scaleX(${safeValue / 100})` }}
      />
    </div>
  );
}
