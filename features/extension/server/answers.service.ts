import "server-only";

import { completeUsage, failUsage, reserveUsage } from "@/features/usage/server/ai-usage.service";
import type { WorkerIdentity } from "@/features/worker/server/worker-auth";
import { getApplicationIntelligenceProvider } from "@/lib/ai/client";
import { aiFailureMessage, describeAiFailure } from "@/lib/ai/errors";
import { normalizeJsonModelOutput } from "@/lib/ai/normalize";
import { FORM_ANSWERS_JSON_REPLY, FORM_ANSWERS_PROMPT } from "@/lib/ai/prompts/form-answers.prompt";
import { createFormAnswersContent, fitAnswer } from "@/lib/ai/prompts/form-answers-input";
import { formAnswersSchema } from "@/lib/ai/schemas/form-answers.schema";
import type { ApplicationIntelligenceProvider } from "@/lib/ai/types";
import type { AnswersRequest } from "../schemas";
import { loadAnswersContext } from "./answers-context";

export type WrittenAnswer = { id: string; answer: string };

export type AnswersResult =
  | { ok: true; answers: WrittenAnswer[] }
  | { ok: false; limited: boolean; message: string };

const NO_RESUME = "Upload a resume to HireLens so answers can be written from it.";

export type AnswersPrompt = { ok: true; system: string; prompt: string } | { ok: false; message: string };

export async function buildFormAnswersPrompt(worker: WorkerIdentity, request: AnswersRequest): Promise<AnswersPrompt> {
  const context = await loadAnswersContext({
    userId: worker.userId,
    applicationPublicId: request.applicationPublicId,
    pageText: request.pageText,
  });

  return context
    ? {
        ok: true,
        system: [FORM_ANSWERS_PROMPT, FORM_ANSWERS_JSON_REPLY].join("\n\n"),
        prompt: createFormAnswersContent({ ...context, questions: request.questions }),
      }
    : { ok: false, message: NO_RESUME };
}

export async function writeFormAnswers(
  worker: WorkerIdentity,
  request: AnswersRequest,
  provider?: ApplicationIntelligenceProvider,
): Promise<AnswersResult> {
  const userId = worker.userId;
  const context = await loadAnswersContext({
    userId,
    applicationPublicId: request.applicationPublicId,
    pageText: request.pageText,
  });

  if (!context) {
    return { ok: false, limited: false, message: NO_RESUME };
  }

  const reservation = await reserveUsage({ userId, action: "FORM_ANSWERS" });

  if (!reservation.ok) {
    return { ok: false, limited: true, message: reservation.message };
  }

  try {
    const result = await (provider ?? getApplicationIntelligenceProvider()).answerForm({
      content: createFormAnswersContent({ ...context, questions: request.questions }),
    });
    const parsed = normalizeJsonModelOutput(result.rawResponse, formAnswersSchema);
    const byId = new Map(parsed.answers.map((item) => [item.id, item.answer]));
    const answers = request.questions.flatMap((question) => {
      const answer = fitAnswer(question, byId.get(question.id) ?? "");

      return answer ? [{ id: question.id, answer }] : [];
    });

    await completeUsage({
      userId,
      reservationId: reservation.reservationId,
      action: "FORM_ANSWERS",
      provider: result.provider,
      model: result.model,
    });

    return { ok: true, answers };
  } catch (error) {
    await failUsage({
      userId,
      reservationId: reservation.reservationId,
      action: "FORM_ANSWERS",
      failureReason: describeAiFailure(error),
    }).catch(() => undefined);

    return {
      ok: false,
      limited: false,
      message: aiFailureMessage(error, "HireLens could not write answers right now. Your allowance was not used."),
    };
  }
}
