import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <label className={cn("block cursor-pointer rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center hover:bg-gray-50", className)}>
      <Upload className="mx-auto size-6 text-gray-500" aria-hidden="true" />
      <span className="mt-3 block text-sm font-semibold text-gray-950">{label}</span>
      {description ? <span className="mt-1 block text-sm text-gray-600">{description}</span> : null}
      <input type="file" className="sr-only" {...props} />
    </label>
  );
}
