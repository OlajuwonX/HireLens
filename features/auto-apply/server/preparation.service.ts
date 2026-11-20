import "server-only";

import { getCurrentApplicationReview, reviewApplicationResume } from "@/features/analyses/server/review.service";
import { ensureApplicationAnalysis } from "@/features/applications/server/application.service";
import { profileCompleteness } from "@/features/candidate-profile/completeness";
import { findProfileByUser } from "@/features/candidate-profile/server/profile.repository";
import type { TaskState } from "@/lib/auto-apply/states";
import { findTaskForUser } from "./task.repository";
import { moveTask } from "./task.service";

export type PrepareResult =
  | { ok: true; state: TaskState; more: boolean }
  | { ok: false; message: string };

const STARTABLE: TaskState[] = ["QUALIFIED", "NEEDS_INPUT", "AWAITING_AI", "FAILED", "READY_FOR_REVIEW", "NEEDS_MANUAL_ACTION"];

type Step = { to: TaskState; reason: string; needs?: string[]; more?: boolean };

async function nextStep(userId: string, task: NonNullable<Awaited<ReturnType<typeof findTaskForUser>>>): Promise<Step> {
  const completeness = profileCompleteness(await findProfileByUser(userId));

  if (!completeness.readyToApply) {
    return {
      to: "NEEDS_INPUT",
      reason: "Your career profile is missing details employers ask for.",
      needs: completeness.missingRequired.map((item) => item.label),
    };
  }

  const analysis = await ensureApplicationAnalysis({ userId, publicId: task.applicationPublicId });

  if (!analysis.ok) {
    return analysis.limited
      ? { to: "AWAITING_AI", reason: `Waiting for AI capacity: ${analysis.message}` }
      : { to: "NEEDS_INPUT", reason: analysis.message, needs: ["Resume"] };
  }

  if (analysis.created) {
    return { to: "PREPARING", reason: "Resume analyzed and optimized for this job.", more: true };
  }

  const ref = { userId, publicId: task.applicationPublicId };
  const existing = await getCurrentApplicationReview(ref);

  if (!existing) {
    const review = await reviewApplicationResume(ref);

    if (!review.ok) {
      return review.error === "LIMIT_REACHED"
        ? { to: "AWAITING_AI", reason: `Waiting for AI capacity: ${review.message}` }
        : { to: "FAILED", reason: review.message };
    }

    return { to: "PREPARING", reason: "Independent review finished.", more: true };
  }

  if (existing.verdict === "REJECTED") {
    return {
      to: "NEEDS_INPUT",
      reason: "The independent review found claims your resume cannot support.",
      needs: ["Fix the issues in the review, then reanalyze"],
    };
  }

  return task.platform
    ? { to: "READY_FOR_REVIEW", reason: "Resume optimized and reviewed. Ready for your approval." }
    : {
        to: "NEEDS_MANUAL_ACTION",
        reason: "This job's site is not supported for automatic applying. Apply with the link, then mark it applied.",
      };
}

export async function advancePreparation(input: { userId: string; publicId: string }): Promise<PrepareResult> {
  const task = await findTaskForUser(input);

  if (!task) {
    return { ok: false, message: "That task could not be found." };
  }

  if (STARTABLE.includes(task.state as TaskState)) {
    const started = await moveTask({ ...input, to: "PREPARING", reason: "Preparing your application." });

    if (!started.ok) {
      return started;
    }
  } else if (task.state !== "PREPARING") {
    return { ok: false, message: "This application is not being prepared." };
  }

  const step = await nextStep(input.userId, task);
  const moved = await moveTask({ ...input, to: step.to, reason: step.reason, needs: step.needs });

  return moved.ok ? { ok: true, state: step.to, more: Boolean(step.more) } : moved;
}
