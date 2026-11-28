import type { FormField } from "../../../local-worker/src/execution/fields";
import { ask } from "../shared/messages";
import type { BoostReply, FillData } from "../shared/types";
import { reloadData } from "./fill-data";
import type { Linked, Progress } from "./link-job";

export const COVER_LETTER = /\bcover letter\b/i;

export function asksForCoverLetter(fields: FormField[]) {
  return fields.some((field) => COVER_LETTER.test(field.label) && (field.kind === "file" || field.kind === "textarea"));
}

export async function ensureCoverLetter(fill: FillData, fields: FormField[], progress: Progress): Promise<Linked> {
  if (fill.coverLetter || !fill.application || fill.match.analyzed || !asksForCoverLetter(fields)) {
    return { fill, notes: [] };
  }

  progress("Writing your cover letter for this job...");

  const reply = await ask<BoostReply>({ type: "boost", applicationPublicId: fill.application.publicId });
  const result: BoostReply = reply.ok ? reply.value : { ok: false, limited: false, message: reply.message };

  return result.ok ? { fill: await reloadData(), notes: [] } : { fill, notes: [`No cover letter was written: ${result.message}`] };
}
