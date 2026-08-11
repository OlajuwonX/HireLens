import { EmptyState } from "@/components/ui/empty-state";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import type { Resume } from "@/lib/db/schema";
import Link from "next/link";
import { deleteResumeAction } from "../actions/resume-actions";
import { ResumeStatusBadge } from "./resume-status-badge";

export function ResumeList({ resumes }: { resumes: Resume[] }) {
  if (resumes.length === 0) {
    return (
      <EmptyState
        title="No resumes yet"
        description="Create your first resume record to start building the library."
      />
    );
  }

  return (
    <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
      {resumes.map((resume) => (
        <li
          key={resume.publicId}
          className="relative rounded-card border border-border bg-surface p-3 transition-colors hover:border-border-strong sm:p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/dashboard/resumes/${resume.publicId}`}
              className="min-w-0 flex-1 before:absolute before:inset-0 before:content-['']"
            >
              <p className="truncate text-meta font-semibold text-text-primary">
                {resume.title}
              </p>
              <p className="mt-0.5 font-mono text-system text-text-muted">
                {resume.createdAt.toLocaleDateString()}
              </p>
            </Link>

            <div className="relative z-10 flex shrink-0 items-center gap-1.5">
              <ResumeStatusBadge status={resume.status} />
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
        </li>
      ))}
    </ul>
  );
}
