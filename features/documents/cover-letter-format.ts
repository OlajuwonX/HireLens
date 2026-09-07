export function coverLetterFilename(
  role: string | null,
  company: string | null,
  extension: "pdf" | "docx",
) {
  const slug = ["cover-letter", role, company]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .toLowerCase();

  return `${slug || "cover-letter"}.${extension}`;
}
