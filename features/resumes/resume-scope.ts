export const RESUME_SCOPES = ["ACTIVE", "ARCHIVED", "ALL"] as const;

export type ResumeScope = (typeof RESUME_SCOPES)[number];

export const resumeScopeLabels: Record<ResumeScope, string> = {
  ACTIVE: "Active job titles",
  ARCHIVED: "Archived",
  ALL: "All",
};

export function filterResumesByScope<T extends { archivedAt: Date | null }>(
  resumes: T[],
  scope: ResumeScope,
): T[] {
  return resumes.filter((resume) => {
    const archived = Boolean(resume.archivedAt);

    if (scope === "ACTIVE") {
      return !archived;
    }

    if (scope === "ARCHIVED") {
      return archived;
    }

    return true;
  });
}
