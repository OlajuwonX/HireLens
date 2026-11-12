"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { AUTO_APPLY_PATH } from "../constants";
import { advancePreparation, type PrepareResult } from "../server/preparation.service";
import {
  approveTask,
  markSubmittedManually,
  moveTask,
  queueApplication,
  type TaskResult,
} from "../server/task.service";

const idSchema = z.uuid();

async function withTask<T>(publicId: unknown, run: (userId: string, publicId: string) => Promise<T>, fallback: T) {
  const user = await requireDatabaseUser();
  const parsed = idSchema.safeParse(publicId);

  if (!parsed.success) {
    return fallback;
  }

  const result = await run(user.id, parsed.data);
  revalidatePath(AUTO_APPLY_PATH);

  return result;
}

const notFound = { ok: false as const, message: "That application could not be found." };

export async function queueApplicationAction(applicationPublicId: string): Promise<TaskResult> {
  return withTask(applicationPublicId, (userId, id) => queueApplication({ userId, applicationPublicId: id }), notFound);
}

export async function prepareTaskAction(publicId: string): Promise<PrepareResult> {
  return withTask(publicId, (userId, id) => advancePreparation({ userId, publicId: id }), notFound);
}

export async function approveTaskAction(publicId: string): Promise<TaskResult> {
  return withTask(publicId, (userId, id) => approveTask({ userId, publicId: id }), notFound);
}

export async function revokeApprovalAction(publicId: string): Promise<TaskResult> {
  return withTask(
    publicId,
    (userId, id) => moveTask({ userId, publicId: id, to: "READY_FOR_REVIEW", reason: "Approval withdrawn." }),
    notFound,
  );
}

export async function cancelTaskAction(publicId: string): Promise<TaskResult> {
  return withTask(
    publicId,
    (userId, id) => moveTask({ userId, publicId: id, to: "CANCELLED", reason: "Removed from Auto Apply." }),
    notFound,
  );
}

export async function markSubmittedAction(publicId: string): Promise<TaskResult> {
  return withTask(publicId, (userId, id) => markSubmittedManually({ userId, publicId: id }), notFound);
}
