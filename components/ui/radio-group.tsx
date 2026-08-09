import * as React from "react";
import { cn } from "@/lib/utils";

export function RadioGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

export type RadioItemProps = React.InputHTMLAttributes<HTMLInputElement>;

export const RadioItem = React.forwardRef<HTMLInputElement, RadioItemProps>(
  ({ className, type: _type, ...props }, ref) => (
    <input
      ref={ref}
      type="radio"
      className={cn(
        "size-4 border-border-strong text-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600",
        className,
      )}
      {...props}
    />
  ),
);

RadioItem.displayName = "RadioItem";
