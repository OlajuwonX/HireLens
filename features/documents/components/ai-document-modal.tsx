"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";
import type { AiView } from "@/features/analyses/server/analysis.mapper";
import { SaveDocumentButton } from "./save-document-button";

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
  title,
  content,
  icon: Icon,
  disabled,
  applicationPublicId,
  view,
  savedDocumentId,
  children,
}: {
  title: string;
  content: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  disabled: boolean;
  applicationPublicId: string;
  view: AiView;
  savedDocumentId: string | null;
  children: ReactNode;
}) {
  const downloadHref =
    view === "IMPROVED_RESUME" && savedDocumentId
      ? `/dashboard/documents/${savedDocumentId}/download`
      : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="row"
          align="start"
          block
          disabled={disabled}
          className="gap-2"
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{title}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[88vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <div className="shrink-0 border-b border-border p-4 pr-12 sm:p-5">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            {title}
          </DialogTitle>
        </div>

        <div className="hl-scroll min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border p-4 sm:p-5">
          <CopyContentButton content={content} label={title} />
          {downloadHref ? (
            <Button asChild variant="outline" size="compact">
              <a href={downloadHref} download>
                <Download className="size-4" aria-hidden />
                Download PDF
              </a>
            </Button>
          ) : null}
          <SaveDocumentButton
            applicationPublicId={applicationPublicId}
            view={view}
            alreadySaved={Boolean(savedDocumentId)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
