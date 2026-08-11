"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ClipboardPaste, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/components/ui/toast";
import { extractJobPostingAction } from "../actions/job-extraction-actions";
import { initialJobExtractionState } from "../actions/job-extraction-state";
import type { ExtractedJob } from "@/lib/ai/schemas/job-extraction.schema";

function ExtractButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled}>
      <Sparkles className="size-4" aria-hidden />
      {pending ? "Extracting job details..." : "Extract job details"}
    </Button>
  );
}

export function JobPasteDialog({
  onExtracted,
}: {
  onExtracted: (job: ExtractedJob) => void;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [clipboardBlocked, setClipboardBlocked] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [state, formAction] = useActionState(
    extractJobPostingAction,
    initialJobExtractionState,
  );
  const handled = useRef(initialJobExtractionState);

  useEffect(() => {
    if (state === handled.current || state.status === "idle") {
      return;
    }

    handled.current = state;

    if (state.status === "error") {
      notify.error(state.message);
      return;
    }

    if (state.job) {
      onExtracted(state.job);
      notify.success(state.message);
      setContent("");
      setOpen(false);
    }
  }, [state, onExtracted]);

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();

      if (!text.trim()) {
        setClipboardBlocked(true);
        notify.info("Your clipboard is empty. Paste the posting below.");
        textareaRef.current?.focus();
        return;
      }

      setContent(text);
      setClipboardBlocked(false);
    } catch {
      setClipboardBlocked(true);
      notify.info(
        "Clipboard access was blocked. Paste the job posting manually below.",
      );
      textareaRef.current?.focus();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <ClipboardPaste className="size-4" aria-hidden />
          Paste job posting
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[88vh] w-[calc(100%-1.5rem)] flex-col gap-0 p-0 sm:max-w-xl">
        <div className="shrink-0 space-y-1.5 border-b border-border p-4 pr-12 sm:p-5">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            Paste job posting
          </DialogTitle>
          <DialogDescription className="text-meta text-text-secondary">
            Copy the whole listing from LinkedIn, Wellfound, Indeed or a careers
            page. HireLens fills the form for you to review.
          </DialogDescription>
        </div>

        <form
          action={formAction}
          className="hl-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-5"
        >
          <Button
            type="button"
            variant="outline"
            onClick={pasteFromClipboard}
            className="w-full sm:w-auto"
          >
            <ClipboardPaste className="size-4" aria-hidden />
            Paste from clipboard
          </Button>

          {clipboardBlocked ? (
            <p role="status" className="text-label text-text-secondary">
              Clipboard access was blocked. Long-press or press Ctrl+V in the box
              below.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="job-posting-content">Job posting</Label>
            <Textarea
              id="job-posting-content"
              name="content"
              ref={textareaRef}
              rows={10}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste the full job listing here..."
              aria-describedby="job-posting-hint"
              className="min-h-44"
            />
            <p id="job-posting-hint" className="text-label text-text-muted">
              Nothing is saved until you review the form and press Save &amp;
              Analyze.
            </p>
          </div>

          {state.status === "error" ? (
            <p role="alert" className="text-label text-danger">
              {state.message}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <ExtractButton disabled={content.trim().length < 50} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
