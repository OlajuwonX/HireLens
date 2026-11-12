import type { TaskPayload, WorkerResult } from "../contract";
import { verifyFills } from "../verification/read-back";
import { planFields } from "./field-map";
import type { FillPlan } from "./fields";
import type { FormSession } from "./session";

export type RunOptions = {
  autoSubmit: boolean;
  confirmTimeoutMs: number;
  draftAnswer?: (question: string) => Promise<string | null>;
};

type Outcome = Omit<WorkerResult, "taskId">;

async function draftMissing(plan: FillPlan, fields: Awaited<ReturnType<FormSession["fields"]>>, options: RunOptions) {
  if (!options.draftAnswer) {
    return plan;
  }

  const missing: string[] = [];

  for (const label of plan.missing) {
    const field = fields.find((candidate) => candidate.label === label);
    const draft = field && field.kind === "textarea" ? await options.draftAnswer(label) : null;

    if (field && draft) {
      plan.fills.push({ field, value: draft, source: "assistant" });
    } else {
      missing.push(label);
    }
  }

  return { fills: plan.fills, missing };
}

export async function runTask(payload: TaskPayload, session: FormSession, options: RunOptions): Promise<Outcome> {
  const fields = await session.fields();

  if (fields.length === 0) {
    return { outcome: "NEEDS_MANUAL_ACTION", reason: "No application form was found on the page.", missing: [] };
  }

  const plan = await draftMissing(planFields(fields, payload), fields, options);
  const failed: string[] = [];

  for (const fill of plan.fills) {
    if (!(await session.fill(fill))) {
      failed.push(fill.field.label);
    }
  }

  const mismatched = await verifyFills(plan.fills.filter((fill) => !failed.includes(fill.field.label)), session.read);
  const problems = [...failed, ...mismatched];
  const drafted = plan.fills.some((fill) => fill.source === "assistant");
  const captcha = await session.hasCaptcha();
  const canAutoSubmit = options.autoSubmit && plan.missing.length === 0 && problems.length === 0 && !drafted && !captcha;

  if (canAutoSubmit) {
    await session.submit();
  }

  const { confirmation, submitAttempted } = await session.waitForOutcome(options.confirmTimeoutMs);

  if (confirmation) {
    return { outcome: "SUBMITTED", reason: "The employer's site confirmed the application.", missing: [], evidence: confirmation };
  }

  if (submitAttempted || canAutoSubmit) {
    return {
      outcome: "UNCONFIRMED",
      reason: "The form was submitted but no confirmation appeared. Check your email before applying again.",
      missing: [],
    };
  }

  const needs = [...plan.missing, ...problems.map((label) => `Check: ${label}`)];

  return {
    outcome: "NEEDS_MANUAL_ACTION",
    reason: needs.length > 0
      ? "The form was filled as far as possible but was not submitted. Finish the listed fields and submit it yourself."
      : "The form was filled and checked but not submitted. Open the job link to finish.",
    missing: needs,
  };
}
