export const MAX_IMPROVED_RESUME_LABEL_LENGTH = 120;

export function improvedResumeFilename(fullName: string, jobTitle: string) {
  const slug = [fullName, jobTitle]
    .join("-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .toLowerCase();

  return `${slug || "improved-resume"}.pdf`;
}

export function improvedResumeVersionLabel(
  jobTitle: string | null,
  company?: string | null,
) {
  return ["AI-assisted", company, jobTitle]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" - ")
    .slice(0, MAX_IMPROVED_RESUME_LABEL_LENGTH);
}

export function legacyImprovedResumeVersionLabel(jobTitle: string | null) {
  const suffix = jobTitle ? ` - ${jobTitle}` : "";

  return `AI-assisted${suffix}`.slice(0, MAX_IMPROVED_RESUME_LABEL_LENGTH);
}
