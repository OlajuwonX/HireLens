import "server-only";

import { findApplicationRowForUser } from "@/features/applications/server/application.repository";
import { detectPlatform } from "@/lib/auto-apply/platform";
import { dailySubmissionLimit, normalizeRole, submissionsRemaining } from "@/lib/auto-apply/policy";
import { canTransition, type TaskState } from "@/lib/auto-apply/states";
import {
  countCommittedToday,
  createTask,
  findCommittedRole,
  findTaskByApplication,
  findTaskForUser,
  transitionTask,
} from "./task.repository";

export type TaskResult = { ok: true; publicId: string } | { ok: false; message: string };

const fail = (message: string): TaskResult => ({ ok: false, message });

export async function queueApplication(input: {
  userId: string;
  applicationPublicId: string;
}): Promise<TaskResult> {
  const row = await findApplicationRowForUser({ userId: input.userId, publicId: input.applicationPublicId });

  if (!row) {
    return fail("That application could not be found.");
  }

  const existing = await findTaskByApplication({ userId: input.userId, applicationId: row.application.id });

  if (existing) {
    return { ok: true, publicId: existing.publicId };
  }

  const roleKey = normalizeRole(row.job.company, row.job.title);

  if (await findCommittedRole({ userId: input.userId, roleKey })) {
    return fail(`You have already applied, or approved an application, for ${row.job.title} at ${row.job.company}.`);
  }

  const task = await createTask({
    userId: input.userId,
    applicationId: row.application.id,
    roleKey,
    platform: detectPlatform(row.job.sourceUrl),
    state: "QUALIFIED",
    stateReason: "Waiting to be prepared",
  });

  return task ? { ok: true, publicId: task.publicId } : fail("That application is already in Auto Apply.");
}

export async function moveTask(input: {
  userId: string;
  publicId: string;
  to: TaskState;
  reason: string;
  needs?: string[];
  patch?: Parameters<typeof transitionTask>[0]["patch"];
}): Promise<TaskResult> {
  const task = await findTaskForUser(input);

  if (!task) {
    return fail("That task could not be found.");
  }

  const from = task.state as TaskState;

  if (!canTransition(from, input.to)) {
    return fail("That action is not available for this application right now.");
  }

  const moved = await transitionTask({
    userId: input.userId,
    taskId: task.id,
    from,
    to: input.to,
    reason: input.reason,
    needs: input.needs,
    patch: input.patch,
  });

  return moved ? { ok: true, publicId: task.publicId } : fail("This application changed. Refresh and try again.");
}

export async function approveTask(input: { userId: string; publicId: string }) {
  const committed = await countCommittedToday(input.userId);

  if (submissionsRemaining(committed) === 0) {
    return fail(`You have reached today's limit of ${dailySubmissionLimit()} applications.`);
  }

  return moveTask({
    ...input,
    to: "APPROVED",
    reason: "Approved by you. It will only be submitted by your local worker.",
    patch: { approvedAt: new Date() },
  });
}

export async function markSubmittedManually(input: { userId: string; publicId: string }) {
  const submittedAt = new Date();

  return moveTask({
    ...input,
    to: "SUBMITTED",
    reason: "You confirmed you submitted this application yourself.",
    patch: { submittedAt, confirmation: { method: "MANUAL", at: submittedAt.toISOString() } },
  });
}
