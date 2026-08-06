import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 5, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "min-h-28 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-950 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
