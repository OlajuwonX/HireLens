import { inspectDocument } from "../../../local-worker/src/browser/dom-inspect";
import { planFields } from "../../../local-worker/src/execution/field-map";
import { RESUME_FILE, type FormField } from "../../../local-worker/src/execution/fields";
import { ask } from "../shared/messages";
import type { FillData, FillSummary } from "../shared/types";
import { attachFile, fillValue, hasValue, highlight } from "./dom-fill";

let data: Promise<FillData> | null = null;
let resume: Promise<File | null> | null = null;
const seen = new Set<string>();

async function loadData() {
  data ??= ask<FillData>({ type: "fill-data", url: location.href }).then((reply) => {
    if (!reply.ok) {
      data = null;
      throw new Error(reply.message);
    }

    return reply.value;
  });

  return data;
}

export function toFile(base64: string, name: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new File([bytes], name, { type: "application/pdf" });
}

function resumeName(fill: FillData) {
  const name = [fill.candidate.firstName, fill.candidate.lastName].filter(Boolean).join("-") || "Resume";

  return `${name.replace(/[^A-Za-z0-9-]/g, "")}-Resume.pdf`;
}

async function loadResume(fill: FillData) {
  resume ??= ask<string>({ type: "resume", path: fill.resume.path }).then((reply) =>
    reply.ok ? toFile(reply.value, resumeName(fill)) : null,
  );

  return resume;
}

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

export async function fillPage(scope: "all" | "new" = "all"): Promise<FillSummary> {
  const fill = await loadData();
  const fields = scope === "new" ? unseenFields() : visibleFields();
  const empty = fields.filter((field) => !hasValue(field));
  const plan = planFields(empty, { candidate: fill.candidate, answers: fill.answers, coverLetter: fill.coverLetter });
  let filled = 0;
  let resumeAttached = false;

  for (const item of plan.fills) {
    const done =
      item.value === RESUME_FILE ? await attachResume(item.field, fill) : fillValue(item.field, item.value);

    filled += done ? 1 : 0;
    resumeAttached ||= done && item.value === RESUME_FILE;
  }

  const missing = empty.filter((field) => field.required && !hasValue(field));

  missing.forEach(highlight);
  fields.forEach((field) => seen.add(field.selector));

  return {
    fields: fields.length,
    filled,
    missing: missing.map((field) => field.label || "Unlabelled field"),
    resumeAttached,
    application: fill.application,
    tailored: fill.resume.tailored,
  };
}

async function attachResume(field: FormField, fill: FillData) {
  const file = await loadResume(fill);

  return file ? attachFile(field, file) : false;
}
