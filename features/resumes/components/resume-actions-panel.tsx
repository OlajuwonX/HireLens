import { Archive, ArchiveRestore, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  archiveResumeAction,
  deleteResumeAction,
  renameResumeAction,
  retryResumeProcessingAction,
} from "@/features/resumes/actions/resume-actions";
import type { Resume } from "@/lib/db/schema";

export function ResumeActionsPanel({ resume }: { resume: Resume }) {
  const archived = resume.status === "ARCHIVED";

  return (
    <div className="space-y-6">
      <form action={renameResumeAction} className="space-y-3">
        <input type="hidden" name="publicId" value={resume.publicId} />
        <Label htmlFor="title">Rename resume</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="title"
            name="title"
            defaultValue={resume.title}
            required
            maxLength={120}
          />
          <Button type="submit" variant="outline" className="sm:shrink-0">
            Rename
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {resume.status === "FAILED" ? (
          <form action={retryResumeProcessingAction}>
            <input type="hidden" name="publicId" value={resume.publicId} />
            <Button type="submit" variant="outline">
              <RotateCcw className="size-4" aria-hidden />
              Retry processing
            </Button>
          </form>
        ) : null}

        <form action={archiveResumeAction}>
          <input type="hidden" name="publicId" value={resume.publicId} />
          <input
            type="hidden"
            name="archived"
            value={archived ? "false" : "true"}
          />
          <Button type="submit" variant="outline">
            {archived ? (
              <ArchiveRestore className="size-4" aria-hidden />
            ) : (
              <Archive className="size-4" aria-hidden />
            )}
            {archived ? "Unarchive" : "Archive"}
          </Button>
        </form>

        <DeleteConfirmButton
          action={deleteResumeAction}
          publicId={resume.publicId}
          title={`Delete ${resume.title}?`}
          description="This will permanently delete the resume record, versions, related files and analysis history. This action cannot be undone."
          confirmLabel="Delete resume"
          toastLabel={resume.title}
        />
      </div>

      <p className="text-label text-text-muted">
        Archiving hides this resume from the library list and from the resume
        picker when you create an application. Nothing is deleted, and you can
        unarchive it at any time.
      </p>
    </div>
  );
}
