import * as React from "react";
import { cn } from "@/lib/utils";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, type: _type, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "size-4 shrink-0 rounded-none border border-border-strong accent-accent",
        className,
      )}
      {...props}
    />
  ),
);

Checkbox.displayName = "Checkbox";
