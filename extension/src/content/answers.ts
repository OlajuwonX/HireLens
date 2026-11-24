import type { FormField } from "../../../local-worker/src/execution/fields";
import { ask } from "../shared/messages";
import type { Writer } from "../shared/settings";
import type { AnswersBody, AnswersReply, FillData } from "../shared/types";
import { fillValue, hasValue, markWritten } from "./dom-fill";
import type { Progress } from "./improve";
import { readPageText } from "./page-text";
import { openQuestions } from "./questions";

const PAGE_LIMIT = 20_000;
const asked = new Set<string>();

export type Written = { written: number; notes: string[] };

async function requestAnswers(body: AnswersBody, writer: Writer): Promise<{ reply: AnswersReply; notes: string[] }> {
  const toReply = (reply: Awaited<ReturnType<typeof ask<AnswersReply>>>): AnswersReply =>
    reply.ok ? reply.value : { ok: false, limited: false, message: reply.message };

  if (writer === "claude") {
    const claude = toReply(await ask<AnswersReply>({ type: "claude-answers", body }));

    if (claude.ok) return { reply: claude, notes: [] };

    const gemini = toReply(await ask<AnswersReply>({ type: "answers", body }));

    return { reply: gemini, notes: [`Claude was not available (${claude.message}), so Gemini wrote the answers.`] };
  }

  return { reply: toReply(await ask<AnswersReply>({ type: "answers", body })), notes: [] };
}

export async function writeOpenAnswers(fill: FillData, fields: FormField[], progress: Progress, writer: Writer = "gemini"): Promise<Written> {
  const open = openQuestions(
    fields.filter((field) => !hasValue(field)),
    asked,
  );

  if (open.questions.length === 0) {
    return { written: 0, notes: [] };
  }

  progress(`${writer === "claude" ? "Claude is writing" : "Writing"} answers for ${open.questions.length} question${open.questions.length === 1 ? "" : "s"}...`);
  open.fields.forEach((field) => asked.add(field.selector));

  const { reply: result, notes } = await requestAnswers(
    {
      url: location.href,
      applicationPublicId: fill.application?.publicId ?? null,
      pageText: fill.application ? "" : readPageText(PAGE_LIMIT),
      questions: open.questions,
    },
    writer,
  );

  if (!result.ok) {
    open.fields.forEach((field) => asked.delete(field.selector));

    return { written: 0, notes: [...notes, result.message] };
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

  return { written, notes };
}
