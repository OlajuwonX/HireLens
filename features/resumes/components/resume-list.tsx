"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Dropdown } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import type { ResumeLibraryItem } from "@/features/resumes/types";
import { deleteResumeAction } from "../actions/resume-actions";
import { ResumeStatusBadge } from "./resume-status-badge";

type ScopeValue = "ACTIVE" | "ARCHIVED" | "ALL";

const scopeOptions = [
  { value: "ACTIVE" as const, label: "Active job titles" },
  { value: "ARCHIVED" as const, label: "Archived" },
  { value: "ALL" as const, label: "All" },
];

export function ResumeList({ resumes }: { resumes: ResumeLibraryItem[] }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeValue>("ACTIVE");

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();

    return resumes.filter((resume) => {
      const archived = Boolean(resume.archivedAt);

      if (scope === "ACTIVE" && archived) {
        return false;
      }

      if (scope === "ARCHIVED" && !archived) {
        return false;
      }

      return !term || resume.title.toLowerCase().includes(term);
    });
  }, [resumes, query, scope]);

  if (resumes.length === 0) {
    return (
      <EmptyState
        title="No job titles yet"
        description="Upload your first resume above. The job title you give it becomes the folder every version and AI-improved resume is filed under."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={query}
            aria-label="Search job titles"
            placeholder="Search job titles"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <Dropdown
          label="Filter job titles"
          className="lg:w-56 lg:shrink-0"
          value={scope}
          onChange={(value) => setScope(value as ScopeValue)}
          options={scopeOptions}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No matching job titles"
          description="Try a different search, or switch the filter to see archived job titles."
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
