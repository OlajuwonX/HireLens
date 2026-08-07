import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <label htmlFor="title" className="text-sm font-medium text-gray-700">
          Rename resume
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input id="title" name="title" defaultValue={resume.title} required maxLength={120} />
          <Button type="submit" variant="secondary">
            Rename
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row">
        {resume.status === "FAILED" ? (
          <form action={retryResumeProcessingAction}>
            <input type="hidden" name="publicId" value={resume.publicId} />
            <Button type="submit" variant="secondary">
              Retry processing
            </Button>
          </form>
        ) : null}
        <form action={archiveResumeAction}>
          <input type="hidden" name="publicId" value={resume.publicId} />
          <Button type="submit" variant="secondary" disabled={resume.status === "ARCHIVED"}>
            Archive
          </Button>
        </form>
        <form action={deleteResumeAction}>
          <input type="hidden" name="publicId" value={resume.publicId} />
          <Button type="submit" variant="danger">
            Delete
          </Button>
        </form>
      </div>
    </div>
  );
}
