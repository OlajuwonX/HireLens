import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-950 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
