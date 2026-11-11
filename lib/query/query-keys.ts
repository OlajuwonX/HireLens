export const queryKeys = {
  savedJobs: (filters: Record<string, string>) =>
    ["saved-jobs", filters] as const,
  documents: (filters: Record<string, string>) =>
    ["documents", filters] as const,
  resumeReview: (applicationPublicId: string) =>
    ["resume-review", applicationPublicId] as const,
};
