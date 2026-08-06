import * as React from "react";
import { cn } from "@/lib/utils";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, type: _type, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "size-4 rounded border-gray-300 text-green-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600",
        className,
      )}
      {...props}
    />
  ),
);

Checkbox.displayName = "Checkbox";
