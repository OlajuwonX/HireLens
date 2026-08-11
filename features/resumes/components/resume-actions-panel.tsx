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
  return (
    <div className="space-y-6">
      <form action={renameResumeAction} className="space-y-3">
        <input type="hidden" name="publicId" value={resume.publicId} />
        <Label htmlFor="title">
          Rename resume
        </Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input id="title" name="title" defaultValue={resume.title} required maxLength={120} />
          <Button type="submit" variant="outline">
            Rename
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row">
        {resume.status === "FAILED" ? (
          <form action={retryResumeProcessingAction}>
            <input type="hidden" name="publicId" value={resume.publicId} />
            <Button type="submit" variant="outline">
              Retry processing
            </Button>
          </form>
        ) : null}
        <form action={archiveResumeAction}>
          <input type="hidden" name="publicId" value={resume.publicId} />
          <Button type="submit" variant="outline" disabled={resume.status === "ARCHIVED"}>
            Archive
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
    </div>
  );
}
