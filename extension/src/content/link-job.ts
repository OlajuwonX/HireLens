import { isFormOnly } from "../../../features/extension/form-page";
import type { HeldDescription } from "../shared/job-posting";
import { ask } from "../shared/messages";
import type { FillData, ImportReply, PageJob } from "../shared/types";
import { reloadData } from "./fill-data";
import { hasJobText, readPageText } from "./page-text";

export type Progress = (text: string) => void;

export type Linked = { fill: FillData; notes: string[] };

const PAGE_LIMIT = 60_000;

async function heldDescription() {
  const reply = await ask<HeldDescription | null>({ type: "held" });

  return reply.ok ? reply.value : null;
}

function pageJob(held: HeldDescription | null, fieldCount: number): PageJob | null {
  if (held) {
    return { url: location.href, title: held.title, text: held.text };
  }

  const text = readPageText(PAGE_LIMIT);

  return hasJobText(text) || fieldCount > 0
    ? { url: location.href, title: document.title, text: text || document.title, formOnly: isFormOnly(text, fieldCount) }
    : null;
}

export async function linkPageJob(fill: FillData, progress: Progress, fieldCount: number): Promise<Linked> {
  if (fill.application) {
    return { fill, notes: [] };
  }

  const held = await heldDescription();
  const page = pageJob(held, fieldCount);

  if (!page) {
    return { fill, notes: [] };
  }

  progress(held ? `Saving this job with the description from ${held.title}...` : "Saving this job to HireLens...");

  const reply = await ask<ImportReply>({ type: "import", page });
  const result: ImportReply = reply.ok ? reply.value : { ok: false, message: reply.message };

  if (!result.ok) {
    return { fill, notes: [result.message] };
  }

  if (held) {
    await ask({ type: "release" });
  }

  const notes = held ? [`Used the job description you saved from ${held.title}.`] : [];

  return { fill: await reloadData(), notes };
}
