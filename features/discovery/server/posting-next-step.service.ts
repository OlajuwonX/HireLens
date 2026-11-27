import "server-only";

import { ensureApplicationAnalysis } from "@/features/applications/server/application.service";
import { stageHref } from "@/features/applications/stages";
import { queueApplication } from "@/features/auto-apply/server/task.service";
import { savePostingToJobs } from "./posting-save.service";

export type PostingStep = "analyze" | "auto-apply";

export type PostingStepResult =
  | { ok: true; href: string }
  | { ok: false; message: string; saved: boolean };

async function runStep(step: PostingStep, userId: string, applicationPublicId: string) {
  if (step === "auto-apply") {
    const queued = await queueApplication({ userId, applicationPublicId });

    return queued.ok ? { ok: true as const, href: stageHref("preparing") } : queued;
  }

  const analyzed = await ensureApplicationAnalysis({ userId, publicId: applicationPublicId });

  return analyzed.ok
    ? { ok: true as const, href: `/dashboard/jobs?open=${applicationPublicId}` }
    : { ok: false as const, message: analyzed.message };
}

export async function continueWithPosting(input: {
  userId: string;
  publicId: string;
  step: PostingStep;
}): Promise<PostingStepResult> {
  const saved = await savePostingToJobs({ userId: input.userId, publicId: input.publicId });

  if (!saved.ok) {
    return { ok: false, message: saved.message, saved: false };
  }

  const result = await runStep(input.step, input.userId, saved.applicationPublicId);

  return result.ok ? result : { ok: false, message: result.message, saved: true };
}
