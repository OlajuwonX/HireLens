"use server";

import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import {
  getNotificationPanel,
  readAllNotifications,
  readNotification,
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
