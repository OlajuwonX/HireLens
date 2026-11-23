import { inspectDocument } from "../../../local-worker/src/browser/dom-inspect";
import { planFields } from "../../../local-worker/src/execution/field-map";
import { RESUME_FILE, type FormField } from "../../../local-worker/src/execution/fields";
import { readSettings } from "../shared/settings";
import type { FillData, FillSummary, MatchSummary } from "../shared/types";
import { writeOpenAnswers } from "./answers";
import { attachFile, fillValue, hasValue, highlight } from "./dom-fill";
import { fileName, loadData, loadPdf } from "./fill-data";
import { improveResume, type Progress } from "./improve";

const COVER_LETTER = /\bcover letter\b/i;
const seen = new Set<string>();
let improved = false;

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

async function prepare(progress: Progress): Promise<{ fill: FillData; match: MatchSummary | null; notes: string[] }> {
  const fill = await loadData();
  const settings = await readSettings();

  if (improved || !settings.improveResume) {
    return { fill, match: null, notes: [] };
  }

  improved = true;

  return improveResume(fill, progress);
}

async function attach(field: FormField, path: string | null, name: string) {
  const file = path ? await loadPdf(path, name) : null;

  return file ? attachFile(field, file) : false;
}

async function fillKnownFields(fill: FillData, empty: FormField[]) {
  const plan = planFields(empty, { candidate: fill.candidate, answers: fill.answers, coverLetter: fill.coverLetter });
  let filled = 0;
  let resumeAttached = false;
  let coverLetterAttached = false;

  for (const item of plan.fills) {
    const isResume = item.value === RESUME_FILE;
    const done = isResume ? await attach(item.field, fill.resume.path, fileName(fill, "Resume")) : fillValue(item.field, item.value);

    filled += done ? 1 : 0;
    resumeAttached ||= done && isResume;
  }

  for (const field of empty.filter((item) => item.kind === "file" && COVER_LETTER.test(item.label) && !hasValue(item))) {
    const done = await attach(field, fill.coverLetterPath, fileName(fill, "Cover-Letter"));

    filled += done ? 1 : 0;
    coverLetterAttached ||= done;
  }

  return { filled, resumeAttached, coverLetterAttached };
}

export async function fillPage(scope: "all" | "new" = "all", progress: Progress = () => undefined): Promise<FillSummary> {
  const { fill, match, notes } = await prepare(progress);
  const settings = await readSettings();
  const fields = scope === "new" ? unseenFields() : visibleFields();
  const empty = fields.filter((field) => !hasValue(field));
  const known = await fillKnownFields(fill, empty);
  const answers = settings.writeAnswers ? await writeOpenAnswers(fill, empty, progress) : { written: 0, notes: [] };
  const missing = empty.filter((field) => field.required && !hasValue(field));

  missing.forEach(highlight);
  fields.forEach((field) => seen.add(field.selector));

  return {
    fields: fields.length,
    filled: known.filled,
    written: answers.written,
    missing: missing.map((field) => field.label || "Unlabelled field"),
    resumeAttached: known.resumeAttached,
    coverLetterAttached: known.coverLetterAttached,
    application: fill.application,
    tailored: fill.resume.tailored,
    match,
    notes: [...notes, ...answers.notes],
  };
}
