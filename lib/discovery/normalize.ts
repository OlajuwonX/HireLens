import { clipboardHtmlToText } from "@/lib/jobs/clipboard-html";
import { detectEmploymentType, detectWorkArrangement } from "@/lib/jobs/parse-job-posting";
import type { Arrangement, Employment } from "./types";

export const MAX_DESCRIPTION_LENGTH = 20_000;
export const MAX_POSTINGS_PER_BOARD = 500;

export function htmlToText(html: string | null | undefined, escaped = false) {
  if (!html) {
    return "";
  }

  const once = clipboardHtmlToText(html);
  const text = escaped ? clipboardHtmlToText(once) : once;

  return tidy(text);
}

export function tidy(text: string | null | undefined) {
  return (text ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim()
    .slice(0, MAX_DESCRIPTION_LENGTH);
}

export function arrangementFrom(
  explicit: string | null | undefined,
  fallbackText: string,
): Arrangement {
  const value = (explicit ?? "").toLowerCase().replace(/[\s_-]/g, "");

  if (value === "remote") return "REMOTE";
  if (value === "hybrid") return "HYBRID";
  if (value === "onsite" || value === "inoffice") return "ON_SITE";

  return (detectWorkArrangement(fallbackText) as Arrangement | null) ?? "NOT_SPECIFIED";
}

export function employmentFrom(value: string | null | undefined): Employment {
  return (detectEmploymentType(value ?? "") as Employment | null) ?? "NOT_SPECIFIED";
}

export function dateFrom(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeKeyPart(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function dedupeKey(input: { company: string; title: string; location: string | null }) {
  return [input.company, input.title, input.location].map(normalizeKeyPart).join("|");
}

export function companyFromToken(token: string) {
  return token
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
