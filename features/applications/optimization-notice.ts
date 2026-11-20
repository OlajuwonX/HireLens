export const OPTIMIZATION_FLAG = "rev";

const notices: Record<string, string> = {
  already_optimized:
    "Your resume is already optimized for this job. HireLens found no meaningful improvements, so it kept it as it is.",
  kept_previous:
    "The new pass was weaker than your current resume, so HireLens kept the current version.",
};

export function optimizationNotice(value: string | string[] | undefined) {
  return typeof value === "string" ? (notices[value] ?? null) : null;
}
