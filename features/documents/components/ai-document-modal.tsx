"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CopyContentButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="compact"
      disabled={!content}
      onClick={async () => {
        await navigator.clipboard.writeText(content);
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
  description,
  content,
  children,
  footer,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  content: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="space-y-1.5 pr-8">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            {title}
          </DialogTitle>
          <DialogDescription className="text-meta text-text-secondary">
            {description}
          </DialogDescription>
        </div>

        <div className="mt-5">{children}</div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          <CopyContentButton content={content} />
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  );
}
