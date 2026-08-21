"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";
import {
  archiveResumeAction,
  retryResumeProcessingAction,
} from "@/features/resumes/actions/resume-actions";
import type { Resume } from "@/lib/db/schema";
import { Archive, ArchiveRestore, RotateCcw, Settings2 } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { RenameResumeForm } from "./rename-resume-form";

export function ManageResumeDialog({
  resume,
  triggerClassName,
}: {
  resume: Resume;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const archived = resume.status === "ARCHIVED";
  const close = useCallback(() => setOpen(false), []);

  function toggleArchive() {
    const formData = new FormData();

    formData.set("publicId", resume.publicId);
    formData.set("archived", archived ? "false" : "true");

    startTransition(async () => {
      try {
        await archiveResumeAction(formData);
        setOpen(false);
        notify.success(
          archived
            ? `${resume.title} was moved back to your active job titles.`
            : `${resume.title} was archived.`,
        );
      } catch {
        notify.error(
          `${resume.title} could not be ${archived ? "unarchived" : "archived"}.`,
        );
      }
    });
  }

  function retryProcessing() {
    const formData = new FormData();

    formData.set("publicId", resume.publicId);

    startTransition(async () => {
      try {
        await retryResumeProcessingAction(formData);
        setOpen(false);
        notify.success(`${resume.title} was queued for processing again.`);
      } catch {
        notify.error(`${resume.title} could not be queued again.`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className={triggerClassName}>
          <Settings2 className="size-4" aria-hidden />
          Manage
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <div className="shrink-0 border-b border-border p-4 pr-12 sm:p-5">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            Manage job title
          </DialogTitle>
          <DialogDescription className="mt-1 text-meta text-text-secondary">
            Rename {resume.title} or move it out of your active job titles.
          </DialogDescription>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <RenameResumeForm
            publicId={resume.publicId}
            title={resume.title}
            onSuccess={close}
          />

          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex flex-wrap items-center gap-2">
              {resume.status === "FAILED" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={retryProcessing}
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Retry processing
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={toggleArchive}
              >
                {archived ? (
                  <ArchiveRestore className="size-4" aria-hidden />
                ) : (
                  <Archive className="size-4" aria-hidden />
                )}
                {archived ? "Unarchive" : "Archive"}
              </Button>
            </div>

            <p className="text-label text-text-muted">
              Archiving hides this job title from the library list and from the
              resume picker when you create an application. Nothing is deleted,
              and you can unarchive it at any time. To delete it for good, use
              the delete button on its card in the resume library.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
