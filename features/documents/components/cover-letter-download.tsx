"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Download, FileText } from "lucide-react";

const FORMATS = [
  { format: "pdf", label: "PDF" },
  { format: "docx", label: "Word (.docx)" },
] as const;

export function CoverLetterDownload({
  publicId,
  size,
}: {
  publicId: string;
  size?: ButtonProps["size"];
}) {
  return (
    <Popover
      title="Download cover letter"
      align="end"
      panelClassName="sm:w-52"
      trigger={(props) => (
        <Button type="button" variant="outline" size={size} {...props}>
          <Download className="size-4" aria-hidden />
          Download
        </Button>
      )}
    >
      {(close) => (
        <div className="space-y-1.5">
          {FORMATS.map((option) => (
            <Button
              key={option.format}
              asChild
              variant="outline"
              block
              align="start"
              size="compact"
              onClick={() => setTimeout(close, 0)}
            >
              <a
                href={`/dashboard/documents/${publicId}/download?format=${option.format}`}
                download
              >
                <FileText className="size-3.5" aria-hidden />
                {option.label}
              </a>
            </Button>
          ))}
        </div>
      )}
    </Popover>
  );
}
