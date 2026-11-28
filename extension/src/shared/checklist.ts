import { isAutofillUpload, isSensitive } from "../../../local-worker/src/execution/field-map";
import type { Fill, FormField } from "../../../local-worker/src/execution/fields";

export type CheckStatus = "profile" | "answer" | "ai" | "resume" | "cover-letter" | "already" | "you" | "needs-you" | "skipped";

export type CheckRow = { selector: string; label: string; status: CheckStatus; reason: string | null };

export type CheckEntry = { field: FormField; filledBy: CheckStatus | null; hadValue: boolean; hasValue: boolean };

const DONE: ReadonlySet<CheckStatus> = new Set(["profile", "answer", "ai", "resume", "cover-letter", "already", "you"]);

export const statusText: Record<CheckStatus, string> = {
  profile: "From your profile",
  answer: "From your saved answers",
  ai: "Written by AI, review it",
  resume: "Resume attached",
  "cover-letter": "Cover letter added",
  already: "Already filled",
  you: "Filled by you",
  "needs-you": "Needs you",
  skipped: "Optional, left empty",
};

export const sourceStatus: Record<Fill["source"], CheckStatus> = {
  profile: "profile",
  answer: "answer",
  resume: "resume",
  "cover-letter": "cover-letter",
  assistant: "ai",
};

export function reasonFor(field: FormField) {
  if (isSensitive(field.label)) return "Personal question. HireLens leaves it to you.";
  if (field.kind === "checkbox") return "Confirm boxes like this yourself.";
  if (field.kind === "file" && isAutofillUpload(field.label)) return "Not needed. HireLens fills the form itself.";
  if (field.kind === "file") return "Upload this file yourself.";
  if (field.kind === "select" || field.kind === "radio") return "None of your saved answers matched these options.";

  return "HireLens has no saved answer for this.";
}

export function checkRow(entry: CheckEntry): CheckRow {
  const status: CheckStatus =
    entry.filledBy ?? (entry.hadValue || entry.hasValue ? "already" : entry.field.required ? "needs-you" : "skipped");

  return {
    selector: entry.field.selector,
    label: entry.field.label || "Unlabelled field",
    status,
    reason: status === "needs-you" || status === "skipped" ? reasonFor(entry.field) : null,
  };
}

export function isDone(status: CheckStatus) {
  return DONE.has(status);
}

export function checkCounts(rows: CheckRow[]) {
  return {
    done: rows.filter((row) => isDone(row.status)).length,
    needsYou: rows.filter((row) => row.status === "needs-you").length,
    skipped: rows.filter((row) => row.status === "skipped").length,
  };
}

export function mergeRows(previous: CheckRow[], next: CheckRow[], exists: (selector: string) => boolean) {
  const bySelector = new Map(previous.filter((row) => exists(row.selector)).map((row) => [row.selector, row]));

  for (const row of next) {
    bySelector.set(row.selector, row);
  }

  return Array.from(bySelector.values());
}
