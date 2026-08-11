export function improvedResumeFilename(fullName: string, jobTitle: string) {
  const slug = [fullName, jobTitle]
    .join("-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .toLowerCase();

  return `${slug || "improved-resume"}.pdf`;
}

export function improvedResumeVersionLabel(jobTitle: string | null) {
  const suffix = jobTitle ? ` - ${jobTitle}` : "";

  return `AI-assisted${suffix}`.slice(0, 120);
}
