"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import type { ResumeLibraryItem } from "@/features/resumes/types";
import { deleteResumeAction } from "../actions/resume-actions";
import {
  RESUME_SCOPES,
  filterResumesByScope,
  resumeScopeLabels,
  type ResumeScope,
} from "../resume-scope";
import { ResumeStatusBadge } from "./resume-status-badge";

export function ResumeList({
  resumes,
  action,
}: {
  resumes: ResumeLibraryItem[];
  action?: React.ReactNode;
}) {
  const [scope, setScope] = useState<ResumeScope>("ACTIVE");

  const visible = useMemo(
    () => filterResumesByScope(resumes, scope),
    [resumes, scope],
  );

  if (resumes.length === 0) {
    return (
      <EmptyState
        title="No job titles yet"
        description="Use Add resume to upload your first one. The job title you give it becomes the folder every version and AI-improved resume is filed under."
        action={action}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Dropdown
          label="Filter job titles"
          className="sm:w-56 sm:shrink-0"
          value={scope}
          onChange={(value) => setScope(value as ResumeScope)}
          options={RESUME_SCOPES.map((value) => ({
            value,
            label: resumeScopeLabels[value],
          }))}
        />

        {action ? <div className="flex shrink-0">{action}</div> : null}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No matching job titles"
          description="Switch the filter to see archived job titles."
        />
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
          {visible.map((resume) => (
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
                    {resume.versionCount}{" "}
                    {resume.versionCount === 1 ? "resume" : "resumes"} ·{" "}
                    {resume.createdAt.toLocaleDateString()}
                  </p>
                </Link>

                <div className="relative z-10 flex shrink-0 items-center gap-1.5">
                  <ResumeStatusBadge status={resume.status} />
                  <DeleteConfirmButton
                    action={deleteResumeAction}
                    publicId={resume.publicId}
                    title={`Delete ${resume.title}?`}
                    description="This will permanently delete the job title, every resume version under it, related files and analysis history. This action cannot be undone."
                    confirmLabel="Delete job title"
                    toastLabel={resume.title}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
