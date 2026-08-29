"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import {
  resolveResumeDesign,
  type ResumeDesignSelection,
} from "@/lib/resume-design";
import { loadClientResumeMetrics } from "@/lib/resume-render/client-metrics";
import { buildResumeLayout } from "@/lib/resume-render/layout";
import { resumeLayoutToSvg } from "@/lib/resume-render/svg";
import type { ResumeMetrics } from "@/lib/resume-render/types";

export function ResumeLivePreview({
  resume,
  selection,
}: {
  resume: ImprovedResume;
  selection: ResumeDesignSelection;
}) {
  const [metrics, setMetrics] = useState<ResumeMetrics | null>(null);
  const [failed, setFailed] = useState(false);
  const requested = useRef<string | null>(null);

  useEffect(() => {
    if (requested.current === selection.typography) {
      return;
    }

    requested.current = selection.typography;

    const controller = new AbortController();

    setFailed(false);
    loadClientResumeMetrics(selection.typography, controller.signal)
      .then((loaded) => setMetrics(() => loaded))
      .catch(() => {
        if (!controller.signal.aborted) {
          requested.current = null;
          setFailed(true);
        }
      });

    return () => controller.abort();
  }, [selection.typography]);

  const rendered = useMemo(() => {
    if (!metrics) {
      return null;
    }

    try {
      const design = resolveResumeDesign(selection);
      const layout = buildResumeLayout(resume, design, metrics);

      return {
        svg: resumeLayoutToSvg(layout, selection.typography, 0),
        pageCount: layout.pages.length,
      };
    } catch {
      return null;
    }
  }, [metrics, resume, selection]);

  return (
    <div className="space-y-2">
      <div className="hl-scroll overflow-auto rounded-card border border-border bg-white">
        {rendered ? (
          <div dangerouslySetInnerHTML={{ __html: rendered.svg }} />
        ) : (
          <div className="flex h-72 items-center justify-center gap-2 px-6 text-center text-meta text-text-secondary">
            {failed ? (
              "The live preview is unavailable. Your edits still save and download correctly."
            ) : (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Preparing preview
              </>
            )}
          </div>
        )}
      </div>

      {rendered && rendered.pageCount > 1 ? (
        <p className="text-label text-text-muted">
          Showing page 1 of {rendered.pageCount}.
        </p>
      ) : null}
    </div>
  );
}
