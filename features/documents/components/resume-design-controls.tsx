"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverChip, PopoverGroup } from "@/components/ui/popover";
import { notify } from "@/components/ui/toast";
import {
  RESUME_SPACING,
  RESUME_TEMPLATES,
  RESUME_TYPOGRAPHY,
  resumeSpacingLabels,
  resumeTemplateLabels,
  resumeTypographyLabels,
  type ResumeDesignSelection,
} from "@/lib/resume-design";
import { Download, Eye, FileText, LayoutTemplate, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { saveResumeDesignAction } from "../actions/resume-design-actions";

const PREVIEW_TIMEOUT_MS = 20_000;

function sameSelection(a: ResumeDesignSelection, b: ResumeDesignSelection) {
  return (
    a.template === b.template &&
    a.typography === b.typography &&
    a.spacing === b.spacing
  );
}

function toQuery(selection: ResumeDesignSelection) {
  return new URLSearchParams({
    template: selection.template,
    typography: selection.typography,
    spacing: selection.spacing,
  });
}

function DownloadLinks({
  publicId,
  selection,
  onDownload,
  close,
}: {
  publicId: string;
  selection: ResumeDesignSelection;
  onDownload: () => void;
  close?: () => void;
}) {
  const query = toQuery(selection);

  function handleDownload() {
    onDownload();

    if (close) {
      setTimeout(close, 0);
    }
  }

  return (
    <div className="space-y-1.5">
      {(
        [
          { format: "pdf", label: "PDF", icon: FileText },
          { format: "docx", label: "Word (.docx)", icon: FileText },
        ] as const
      ).map((option) => (
        <Button
          key={option.format}
          asChild
          variant="outline"
          block
          align="start"
          size="compact"
          onClick={handleDownload}
        >
          <a
            href={`/dashboard/documents/${publicId}/download?format=${option.format}&${query}`}
            download
          >
            <option.icon className="size-3.5" aria-hidden />
            {option.label}
          </a>
        </Button>
      ))}
    </div>
  );
}

export function ResumeDesignControls({
  publicId,
  savedSelection,
}: {
  publicId: string;
  savedSelection: ResumeDesignSelection;
}) {
  const [selection, setSelection] = useState(savedSelection);
  const [persisted, setPersisted] = useState(savedSelection);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [svg, setSvg] = useState("");
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, startSaving] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  const persist = useCallback(
    (next: ResumeDesignSelection) => {
      if (sameSelection(next, persisted)) {
        return;
      }

      const formData = new FormData();

      formData.set("publicId", publicId);
      formData.set("template", next.template);
      formData.set("typography", next.typography);
      formData.set("spacing", next.spacing);

      setPersisted(next);
      startSaving(async () => {
        const result = await saveResumeDesignAction(
          { status: "idle", message: "" },
          formData,
        );

        if (result.status === "error") {
          notify.error(result.message);
        }
      });
    },
    [persisted, publicId],
  );

  const loadPreview = useCallback(
    async (next: ResumeDesignSelection) => {
      abortRef.current?.abort();

      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, PREVIEW_TIMEOUT_MS);

      abortRef.current = controller;
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/dashboard/documents/${publicId}/preview?${toQuery(next)}`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "This resume has no stored analysis to preview from. You can still download it."
              : "The preview could not be built.",
          );
        }

        const data = (await response.json()) as {
          svg: string;
          pageCount: number;
        };

        setSvg(data.svg);
        setPageCount(data.pageCount);
        setError("");
        setLoading(false);
      } catch (cause) {
        if (controller.signal.aborted && !timedOut) {
          return;
        }

        setSvg("");
        setError(
          timedOut
            ? "The preview timed out. You can still download the resume."
            : cause instanceof Error
              ? cause.message
              : "The preview could not be loaded.",
        );
        setLoading(false);
      } finally {
        clearTimeout(timer);
      }
    },
    [publicId],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!previewOpen) {
      return;
    }

    const timer = setTimeout(() => void loadPreview(selection), 150);

    return () => clearTimeout(timer);
  }, [previewOpen, selection, loadPreview]);

  function openPreview() {
    setTemplatesOpen(false);
    setPreviewOpen(true);
    persist(selection);
  }

  return (
    <>
      <Popover
        title="Customize resume"
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        trigger={(props) => (
          <Button type="button" variant="outline" {...props}>
            <LayoutTemplate className="size-4" aria-hidden />
            Templates
          </Button>
        )}
      >
        <div className="space-y-3">
          <PopoverGroup label="Template">
            {RESUME_TEMPLATES.map((template) => (
              <PopoverChip
                key={template}
                name="resume-template"
                checked={selection.template === template}
                label={resumeTemplateLabels[template]}
                onSelect={() =>
                  setSelection((current) => ({ ...current, template }))
                }
              />
            ))}
          </PopoverGroup>

          <PopoverGroup label="Typeface">
            {RESUME_TYPOGRAPHY.map((typography) => (
              <PopoverChip
                key={typography}
                name="resume-typography"
                checked={selection.typography === typography}
                label={resumeTypographyLabels[typography]}
                onSelect={() =>
                  setSelection((current) => ({ ...current, typography }))
                }
              />
            ))}
          </PopoverGroup>

          <PopoverGroup label="Spacing">
            {RESUME_SPACING.map((spacing) => (
              <PopoverChip
                key={spacing}
                name="resume-spacing"
                checked={selection.spacing === spacing}
                label={resumeSpacingLabels[spacing]}
                onSelect={() =>
                  setSelection((current) => ({ ...current, spacing }))
                }
              />
            ))}
          </PopoverGroup>

          <div className="space-y-1.5 border-t border-border pt-3">
            <Button type="button" block size="compact" onClick={openPreview}>
              <Eye className="size-3.5" aria-hidden />
              Preview
            </Button>

            <DownloadLinks
              publicId={publicId}
              selection={selection}
              onDownload={() => persist(selection)}
            />
          </div>
        </div>
      </Popover>

      <Popover
        title="Download resume"
        panelClassName="sm:w-52"
        trigger={(props) => (
          <Button type="button" variant="outline" {...props}>
            <Download className="size-4" aria-hidden />
            Download
          </Button>
        )}
      >
        {(close) => (
          <DownloadLinks
            publicId={publicId}
            selection={selection}
            onDownload={() => persist(selection)}
            close={close}
          />
        )}
      </Popover>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            Resume preview
          </DialogTitle>
          <DialogDescription className="mt-1 text-meta text-text-secondary">
            {resumeTemplateLabels[selection.template]} ·{" "}
            {resumeTypographyLabels[selection.typography]} ·{" "}
            {resumeSpacingLabels[selection.spacing]} spacing
            {pageCount > 1 ? " · page 1 of " + pageCount : null}
          </DialogDescription>

          <div className="hl-scroll mt-3 max-h-[62vh] overflow-auto rounded-card border border-border bg-white">
            {svg ? (
              <div dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <div className="flex h-64 items-center justify-center gap-2 px-6 text-center text-meta text-text-secondary">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Building preview
                  </>
                ) : (
                  error
                )}
              </div>
            )}
          </div>

          <p
            className="mt-2 min-h-4 text-label text-text-muted"
            aria-live="polite"
          >
            {loading && svg ? "Updating preview" : null}
            {!loading && error && svg ? error : null}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(false)}
            >
              Close
            </Button>

            <Popover
              title="Download resume"
              align="end"
              panelClassName="sm:w-52"
              trigger={(props) => (
                <Button type="button" {...props}>
                  <Download className="size-4" aria-hidden />
                  Download
                </Button>
              )}
            >
              {(close) => (
                <DownloadLinks
                  publicId={publicId}
                  selection={selection}
                  onDownload={() => persist(selection)}
                  close={close}
                />
              )}
            </Popover>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
