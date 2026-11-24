"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";
import type { AiView } from "@/features/analyses/server/analysis.mapper";
import { saveAnalysisViewAction } from "../actions/document-actions";
import { initialDocumentFormState } from "../actions/document-form-state";
import { CoverLetterDownload } from "./cover-letter-download";
import { SaveDocumentButton } from "./save-document-button";

const CLOSE_AFTER_SAVE_MS = 200;

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
  disabled,
  disabledReason,
  applicationPublicId,
  view,
  savedDocumentId,
  children,
}: {
  title: string;
  content: string;
  disabled: boolean;
  disabledReason?: string;
  applicationPublicId: string;
  view: AiView;
  savedDocumentId: string | null;
  children: ReactNode;
}) {
  const downloadHref =
    view === "IMPROVED_RESUME" && savedDocumentId
      ? `/dashboard/documents/${savedDocumentId}/download`
      : null;

  const [open, setOpen] = useState(false);
  const [optimisticSaved, setOptimisticSaved] = useState(false);
  const [state, action] = useActionState(
    saveAnalysisViewAction,
    initialDocumentFormState,
  );
  const announced = useRef(initialDocumentFormState);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (state === announced.current || state.status === "idle") {
      return;
    }

    announced.current = state;

    if (state.status === "error") {
      setOptimisticSaved(false);
      notify.error(
        state.message
          ? `${title} was not saved. ${state.message}`
          : `${title} failed to save to AI Documents.`,
      );
      return;
    }

    notify.success(state.message);
  }, [state, title]);

  function handleOptimisticSave() {
    setOptimisticSaved(true);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_AFTER_SAVE_MS);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="row"
          align="start"
          block
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
          className="gap-2"
        >
          <span className="truncate">{title}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[88dvh] flex-col gap-0 p-0 sm:max-w-2xl">
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
                Download PDF
              </a>
            </Button>
          ) : null}
          {view === "COVER_LETTER" && savedDocumentId ? (
            <CoverLetterDownload publicId={savedDocumentId} size="compact" />
          ) : null}
          <SaveDocumentButton
            applicationPublicId={applicationPublicId}
            view={view}
            alreadySaved={Boolean(savedDocumentId) || optimisticSaved}
            action={action}
            onOptimisticSave={handleOptimisticSave}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
