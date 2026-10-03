"use server";

import { isImpersonating } from "@/features/auth/server/impersonation";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  getNotificationPanel,
  readAllNotifications,
  readNotification,
  removeAllNotificationsForUser,
  removeNotificationForUser,
  type NotificationItem,
} from "@/features/notifications/server/notification.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const publicIdSchema = z.string().uuid();

export async function loadNotificationsAction(): Promise<NotificationItem[]> {
  const user = await requireDatabaseUser();

  return getNotificationPanel(user.id);
}

export async function markNotificationReadAction(publicId: string) {
  const user = await requireDatabaseUser();
  const parsed = publicIdSchema.safeParse(publicId);

  if (!parsed.success) {
    return;
  }

  await readNotification({ userId: user.id, publicId: parsed.data });
  revalidatePath("/dashboard", "layout");
}

export async function markAllNotificationsReadAction() {
  const user = await requireDatabaseUser();

  await readAllNotifications(user.id);
  revalidatePath("/dashboard", "layout");
}

export type NotificationMutationResult =
  | { ok: true }
  | { ok: false; message: string };

const IMPERSONATING_MESSAGE = "Unavailable while impersonating a user.";

export async function deleteNotificationAction(
  publicId: string,
): Promise<NotificationMutationResult> {
  if (await isImpersonating()) {
    return { ok: false, message: IMPERSONATING_MESSAGE };
  }

  const user = await requireDatabaseUser();
  const parsed = publicIdSchema.safeParse(publicId);

  if (!parsed.success) {
    return { ok: false, message: "That notification could not be found." };
  }

  await removeNotificationForUser({ userId: user.id, publicId: parsed.data });
  revalidatePath("/dashboard", "layout");

  return { ok: true };
}

export async function clearAllNotificationsAction(): Promise<NotificationMutationResult> {
  if (await isImpersonating()) {
    return { ok: false, message: IMPERSONATING_MESSAGE };
  }

  const user = await requireDatabaseUser();

  await removeAllNotificationsForUser(user.id);
  revalidatePath("/dashboard", "layout");

  return { ok: true };
}
