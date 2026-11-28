import { inspectDocument } from "../../../local-worker/src/browser/dom-inspect";
import { checkRow, type CheckStatus } from "../shared/checklist";
import { readSettings } from "../shared/settings";
import type { FillData, FillSummary, MatchSummary } from "../shared/types";
import { writeOpenAnswers } from "./answers";
import { ensureCoverLetter } from "./cover-letter";
import { hasValue, highlight } from "./dom-fill";
import { loadData } from "./fill-data";
import { improveResume } from "./improve";
import { fillKnownFields } from "./known-fields";
import { linkPageJob, type Progress } from "./link-job";

const seen = new Set<string>();
const RESUME_FAILED = "HireLens found the resume upload but could not attach the file. Please upload it yourself.";
let improved = false;
let linkTried = false;

function isShown(element: Element) {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
}

function visibleFields() {
  return inspectDocument().filter(
    (field) => field.kind === "file" || Array.from(document.querySelectorAll(field.selector)).some(isShown),
  );
}

export function countFields() {
  return visibleFields().length;
}

export function unseenFields() {
  return visibleFields().filter((field) => !seen.has(field.selector));
}

async function prepare(progress: Progress, retryLink: boolean): Promise<{ fill: FillData; match: MatchSummary | null; notes: string[] }> {
  const start = await loadData();
  const settings = await readSettings();
  const linked = linkTried && !retryLink ? { fill: start, notes: [] } : await linkPageJob(start, progress, countFields());

  linkTried = true;

  if (improved || !settings.improveResume) {
    return { fill: linked.fill, match: null, notes: linked.notes };
  }

  improved = true;

  return improveResume(linked, progress);
}

export async function fillPage(scope: "all" | "new" = "all", progress: Progress = () => undefined): Promise<FillSummary> {
  const prepared = await prepare(progress, scope === "all");
  const settings = await readSettings();
  const fields = scope === "new" ? unseenFields() : visibleFields();
  const hadValue = new Set(fields.filter(hasValue).map((field) => field.selector));
  const empty = fields.filter((field) => !hadValue.has(field.selector));
  const letter = await ensureCoverLetter(prepared.fill, empty, progress);
  const fill = letter.fill;
  const known = await fillKnownFields(fill, empty);
  const open = empty.filter((field) => !known.filledBy.has(field.selector));
  const answers = settings.writeAnswers
    ? await writeOpenAnswers(fill, open, progress, settings.writer)
    : { written: 0, notes: [], selectors: [] };
  const filledBy = new Map<string, CheckStatus>([...known.filledBy, ...answers.selectors.map((selector) => [selector, "ai"] as const)]);
  const checklist = fields.map((field) =>
    checkRow({ field, filledBy: filledBy.get(field.selector) ?? null, hadValue: hadValue.has(field.selector), hasValue: hasValue(field) }),
  );
  const missing = fields.filter((field, index) => checklist[index].status === "needs-you");

  missing.forEach(highlight);
  fields.forEach((field) => seen.add(field.selector));

  return {
    fields: fields.length,
    filled: known.filledBy.size,
    written: answers.written,
    missing: missing.map((field) => field.label || "Unlabelled field"),
    resumeAttached: known.resumeAttached,
    coverLetterAttached: known.coverLetterAttached,
    application: fill.application,
    tailored: fill.resume.tailored,
    match: prepared.match,
    notes: [
      ...prepared.notes,
      ...letter.notes,
      ...(known.resumeWanted && !known.resumeAttached ? [RESUME_FAILED] : []),
      ...answers.notes,
    ],
    checklist,
  };
}
