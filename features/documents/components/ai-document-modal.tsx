"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";

export function CopyContentButton({
  content,
  label,
}: {
  content: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="compact"
      disabled={!content}
      onClick={async () => {
        await navigator.clipboard.writeText(content);
        notify.copied(label);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function PlainTextPanel({ content }: { content: string }) {
  if (!content) {
    return (
      <p className="text-meta text-text-secondary">
        Nothing was returned for this section.
      </p>
    );
  }

  return (
    <p className="whitespace-pre-wrap wrap-break-word text-meta leading-relaxed text-text-primary">
      {content}
    </p>
  );
}

export function AiDocumentModal({
  trigger,
  title,
  content,
  children,
  footer,
  downloadHref,
}: {
  trigger: ReactNode;
  title: string;
  content: string;
  children: ReactNode;
  footer?: ReactNode;
  downloadHref?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <div className="border-b border-border p-4 pr-12 sm:p-5">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            {title}
          </DialogTitle>
        </div>

        <div className="hl-scroll min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4 sm:p-5">
          <CopyContentButton content={content} label={title} />
          {downloadHref ? (
            <Button asChild variant="outline" size="compact">
              <a href={downloadHref} rel="noopener">
                <Download className="size-4" aria-hidden />
                Download PDF
              </a>
            </Button>
          ) : null}
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  );
}
