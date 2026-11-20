import { clipboardHtmlToText } from "@/lib/jobs/clipboard-html";
import { detectEmploymentType, detectWorkArrangement } from "@/lib/jobs/parse-job-posting";
import type { Arrangement, Employment } from "./types";

export const MAX_DESCRIPTION_LENGTH = 20_000;
export const MAX_POSTINGS_PER_BOARD = 500;

const HTML_TAG = /<\/?[a-z][a-z0-9]*(\s[^>]*)?\/?>/i;
const MAX_PASSES = 3;

export function containsHtml(value: string) {
  return HTML_TAG.test(value);
}

export function htmlToText(html: string | null | undefined, escaped = false) {
  if (!html) {
    return "";
  }

  let text = clipboardHtmlToText(html);

  for (let pass = 1; pass < MAX_PASSES && (escaped || containsHtml(text)); pass += 1) {
    text = clipboardHtmlToText(text);
    escaped = false;
  }

  return tidy(text);
}

export function cleanDescription(value: string) {
  return containsHtml(value) || /&(lt|gt|amp|nbsp|quot);/i.test(value) ? htmlToText(value) : value;
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

const COMPANY_SUFFIX = /\b(inc|llc|ltd|limited|corp|corporation|co|gmbh|plc|sa|ag|bv|group|holdings|technologies|technology|labs)\b/g;

const TITLE_SYNONYMS: [RegExp, string][] = [
  [/\b(developer|programmer)\b/g, "engineer"],
  [/\bsr\b/g, "senior"],
  [/\bjr\b/g, "junior"],
  [/\bfront end\b/g, "frontend"],
  [/\bback end\b/g, "backend"],
  [/\bfull stack\b/g, "fullstack"],
];

export function companyKey(company: string) {
  return normalizeKeyPart(company).replace(COMPANY_SUFFIX, "").replace(/\s+/g, " ").trim();
}

export function titleKey(title: string) {
  return TITLE_SYNONYMS.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), normalizeKeyPart(title))
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupeKey(input: { company: string; title: string }) {
  return `${companyKey(input.company)}|${titleKey(input.title)}`;
}

export function companyFromToken(token: string) {
  return token
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
