import { Card, CardContent } from "@/components/ui/card";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
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
    <div className="grid gap-4">
      {resumes.map((resume) => (
        <Card key={resume.publicId}>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
            <div className="min-w-0">
              <Link
                href={`/dashboard/resumes/${resume.publicId}`}
                className="font-semibold text-text-primary hover:text-text-primary"
              >
                {resume.title}
              </Link>
              <p className="mt-1 text-meta text-text-secondary">
                Created {resume.createdAt.toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ResumeStatusBadge status={resume.status} />
              <DeleteConfirmButton
                action={deleteResumeAction}
                publicId={resume.publicId}
                title={`Delete ${resume.title}?`}
                description="This will permanently delete the resume record, versions, related files and analysis history. This action cannot be undone."
                confirmLabel="Delete resume"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
