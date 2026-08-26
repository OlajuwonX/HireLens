"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Download, Eye, LayoutTemplate, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverGroup, PopoverOption } from "@/components/ui/popover";
import { notify } from "@/components/ui/toast";
import {
  RESUME_SPACING,
  RESUME_TEMPLATES,
  RESUME_TYPOGRAPHY,
  resumeSpacingLabels,
  resumeTemplateHints,
  resumeTemplateLabels,
  resumeTypographyLabels,
  type ResumeDesignSelection,
} from "@/lib/resume-design";
import { saveResumeDesignAction } from "../actions/resume-design-actions";

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
    (next: ResumeDesignSelection) => {
      abortRef.current?.abort();

      const controller = new AbortController();

      abortRef.current = controller;
      setLoading(true);
      setError("");

      fetch(`/dashboard/documents/${publicId}/preview?${toQuery(next)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("This document cannot be previewed.");
          }

          return response.json() as Promise<{
            svg: string;
            pageCount: number;
          }>;
        })
        .then((data) => {
          setSvg(data.svg);
          setPageCount(data.pageCount);
          setLoading(false);
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) {
            return;
          }

          setError(
            cause instanceof Error
              ? cause.message
              : "The preview could not be loaded.",
          );
          setLoading(false);
        });
    },
    [publicId],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!previewOpen) {
      return;
    }

    const timer = setTimeout(() => loadPreview(selection), 200);

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
        <div className="space-y-4">
          <p className="text-label font-medium text-text-primary">
            Customize resume
          </p>

          <PopoverGroup label="Template">
            <div className="grid grid-cols-2 gap-2">
              {RESUME_TEMPLATES.map((template) => (
                <PopoverOption
                  key={template}
                  name="resume-template"
                  checked={selection.template === template}
                  label={resumeTemplateLabels[template]}
                  hint={resumeTemplateHints[template]}
                  onSelect={() =>
                    setSelection((current) => ({ ...current, template }))
                  }
                />
              ))}
            </div>
          </PopoverGroup>

          <PopoverGroup label="Typography">
            <div className="space-y-2">
              {RESUME_TYPOGRAPHY.map((typography) => (
                <PopoverOption
                  key={typography}
                  name="resume-typography"
                  checked={selection.typography === typography}
                  label={resumeTypographyLabels[typography]}
                  onSelect={() =>
                    setSelection((current) => ({ ...current, typography }))
                  }
                />
              ))}
            </div>
          </PopoverGroup>

          <PopoverGroup label="Spacing">
            <div className="grid grid-cols-2 gap-2">
              {RESUME_SPACING.map((spacing) => (
                <PopoverOption
                  key={spacing}
                  name="resume-spacing"
                  checked={selection.spacing === spacing}
                  label={resumeSpacingLabels[spacing]}
                  onSelect={() =>
                    setSelection((current) => ({ ...current, spacing }))
                  }
                />
              ))}
            </div>
          </PopoverGroup>

          <Button type="button" block onClick={openPreview}>
            <Eye className="size-4" aria-hidden />
            Preview
          </Button>
        </div>
      </Popover>

      <ResumeDownloadPopover
        publicId={publicId}
        selection={selection}
        onDownload={() => persist(selection)}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            Resume preview
          </DialogTitle>
          <DialogDescription className="mt-1 text-meta text-text-secondary">
            This is what your resume will look like.
            {pageCount > 1 ? " Showing page 1." : null}
          </DialogDescription>

          <p className="mt-3 font-mono text-system uppercase text-text-muted">
            {resumeTemplateLabels[selection.template]} ·{" "}
            {resumeTypographyLabels[selection.typography]} ·{" "}
            {resumeSpacingLabels[selection.spacing]} spacing
          </p>

          <div className="hl-scroll mt-3 max-h-[65vh] overflow-auto rounded-card border border-border bg-white">
            {loading ? (
              <div className="flex h-64 items-center justify-center gap-2 text-meta text-text-secondary">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Building preview
              </div>
            ) : null}

            {!loading && error ? (
              <div className="flex h-64 items-center justify-center px-6 text-center text-meta text-text-secondary">
                {error}
              </div>
            ) : null}

            {!loading && !error && svg ? (
              <div
                className="min-w-[20rem]"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <ResumeDownloadPopover
              publicId={publicId}
              selection={selection}
              align="end"
              onDownload={() => persist(selection)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ResumeDownloadPopover({
  publicId,
  selection,
  align = "start",
  onDownload,
}: {
  publicId: string;
  selection: ResumeDesignSelection;
  align?: "start" | "end";
  onDownload: () => void;
}) {
  const query = toQuery(selection);

  return (
    <Popover
      title="Download resume"
      align={align}
      trigger={(props) => (
        <Button type="button" variant="outline" {...props}>
          <Download className="size-4" aria-hidden />
          Download
        </Button>
      )}
    >
      {(close) => (
        <div className="space-y-3">
          <p className="text-label font-medium text-text-primary">
            Download resume
          </p>

          <div className="space-y-2">
            {(
              [
                { format: "pdf", label: "PDF", hint: "Best for applying" },
                { format: "docx", label: "Word / DOCX", hint: "Editable" },
              ] as const
            ).map((option) => (
              <Button
                key={option.format}
                asChild
                variant="outline"
                block
                align="start"
                onClick={() => {
                  onDownload();
                  close();
                }}
              >
                <a
                  href={`/dashboard/documents/${publicId}/download?format=${option.format}&${query}`}
                >
                  <span className="flex-1 text-left">{option.label}</span>
                  <span className="text-label font-normal text-text-muted">
                    {option.hint}
                  </span>
                </a>
              </Button>
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}
