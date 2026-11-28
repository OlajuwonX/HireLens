import { planFields } from "../../../local-worker/src/execution/field-map";
import { RESUME_FILE, type FormField } from "../../../local-worker/src/execution/fields";
import { sourceStatus, type CheckStatus } from "../shared/checklist";
import type { FillData } from "../shared/types";
import { COVER_LETTER } from "./cover-letter";
import { attachFile, fillValue, hasValue } from "./dom-fill";
import { fileName, loadPdf } from "./fill-data";

export type KnownFill = {
  filledBy: Map<string, CheckStatus>;
  resumeWanted: boolean;
  resumeAttached: boolean;
  coverLetterAttached: boolean;
};

async function attach(field: FormField, path: string | null, name: string) {
  const file = path ? await loadPdf(path, name) : null;

  return file ? attachFile(field, file) : false;
}

export async function fillKnownFields(fill: FillData, empty: FormField[]): Promise<KnownFill> {
  const plan = planFields(empty, { candidate: fill.candidate, answers: fill.answers, coverLetter: fill.coverLetter });
  const filledBy = new Map<string, CheckStatus>();
  let resumeWanted = false;
  let resumeAttached = false;
  let coverLetterAttached = false;

  for (const item of plan.fills) {
    const isResume = item.value === RESUME_FILE;
    const done = isResume ? await attach(item.field, fill.resume.path, fileName(fill, "Resume")) : fillValue(item.field, item.value);

    if (done) filledBy.set(item.field.selector, sourceStatus[item.source]);
    resumeWanted ||= isResume;
    resumeAttached ||= done && isResume;
  }

  for (const field of empty.filter((item) => item.kind === "file" && COVER_LETTER.test(item.label) && !hasValue(item))) {
    const done = await attach(field, fill.coverLetterPath, fileName(fill, "Cover-Letter"));

    if (done) filledBy.set(field.selector, "cover-letter");
    coverLetterAttached ||= done;
  }

  return { filledBy, resumeWanted, resumeAttached, coverLetterAttached };
}
