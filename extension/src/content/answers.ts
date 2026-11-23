import type { FormField } from "../../../local-worker/src/execution/fields";
import { ask } from "../shared/messages";
import type { AnswersReply, FillData } from "../shared/types";
import { fillValue, hasValue, markWritten } from "./dom-fill";
import type { Progress } from "./improve";
import { readPageText } from "./page-text";
import { openQuestions } from "./questions";

const PAGE_LIMIT = 20_000;
const asked = new Set<string>();

export type Written = { written: number; notes: string[] };

export async function writeOpenAnswers(fill: FillData, fields: FormField[], progress: Progress): Promise<Written> {
  const open = openQuestions(
    fields.filter((field) => !hasValue(field)),
    asked,
  );

  if (open.questions.length === 0) {
    return { written: 0, notes: [] };
  }

  progress(`Writing answers for ${open.questions.length} question${open.questions.length === 1 ? "" : "s"}...`);
  open.fields.forEach((field) => asked.add(field.selector));

  const reply = await ask<AnswersReply>({
    type: "answers",
    body: {
      url: location.href,
      applicationPublicId: fill.application?.publicId ?? null,
      pageText: fill.application ? "" : readPageText(PAGE_LIMIT),
      questions: open.questions,
    },
  });

  const result = reply.ok ? reply.value : { ok: false as const, limited: false, message: reply.message };

  if (!result.ok) {
    open.fields.forEach((field) => asked.delete(field.selector));

    return { written: 0, notes: [result.message] };
  }

  const bySelector = new Map(open.fields.map((field) => [field.selector, field]));
  let written = 0;

  for (const { id, answer } of result.answers) {
    const field = bySelector.get(id);

    if (field && !hasValue(field) && fillValue(field, answer)) {
      markWritten(field);
      written += 1;
    }
  }

  return { written, notes: [] };
}
