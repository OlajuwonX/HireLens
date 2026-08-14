import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import * as React from "react";

export type FileDropzoneProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
};

export function FileDropzone({
  className,
  label = "Upload file",
  description,
  ...props
}: FileDropzoneProps) {
  return (
    <label
      className={cn(
        "block cursor-pointer rounded-card border border-dashed border-border-strong bg-surface p-8 text-center transition-colors",
        "hover:border-accent-hover hover:bg-surface-secondary",
        "focus-within:border-accent-hover focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent-hover",
        className,
      )}
    >
      <Upload aria-hidden="true" className="mx-auto size-5 text-text-muted" />
      <span className="mt-3 block text-meta font-semibold text-text-primary">
        {label}
      </span>
      {description ? (
        <span className="mt-1 block text-label text-text-secondary">
          {description}
        </span>
      ) : null}
      <input type="file" className="sr-only" {...props} />
    </label>
  );
}
