import "server-only";

import {
  findApplicationRowForUser,
  promoteSavedApplication,
  recordApplicationActivity,
} from "@/features/applications/server/application.repository";
import { findTaskByApplication } from "@/features/auto-apply/server/task.repository";
import { markSubmittedManually, moveTask } from "@/features/auto-apply/server/task.service";
import { canTransition, type TaskState } from "@/lib/auto-apply/states";
import type { WorkerIdentity } from "@/features/worker/server/worker-auth";

export async function markAppliedFromExtension(worker: WorkerIdentity, applicationPublicId: string) {
  const row = await findApplicationRowForUser({ userId: worker.userId, publicId: applicationPublicId });

  if (!row) {
    return false;
  }

  const applicationId = row.application.id;
  const task = await findTaskByApplication({ userId: worker.userId, applicationId });

  await promoteSavedApplication({ userId: worker.userId, applicationId });
  await recordApplicationActivity({
    userId: worker.userId,
    applicationId,
    title: "Applied with the HireLens extension",
  });

  const state = task?.state as TaskState | undefined;

  if (task && state && canTransition(state, "SUBMITTED")) {
    await markSubmittedManually({ userId: worker.userId, publicId: task.publicId });
  } else if (task && state && canTransition(state, "CANCELLED")) {
    await moveTask({
      userId: worker.userId,
      publicId: task.publicId,
      to: "CANCELLED",
      reason: "You applied with the HireLens extension, so the worker will not apply again.",
    });
  }

  return true;
}
