import "server-only";

import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications, notifications, type NewNotification } from "@/lib/db/schema";
import { NOTIFICATION_PANEL_SIZE } from "../constants";
import type { NotificationSource } from "../notification-item";

export async function countUnreadNotifications(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

  return row?.value ?? 0;
}

export async function listNotificationsForUser(input: {
  userId: string;
  limit?: number;
}): Promise<NotificationSource[]> {
  return db
    .select({
      publicId: notifications.publicId,
      title: notifications.title,
      body: notifications.body,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      applicationPublicId: applications.publicId,
    })
    .from(notifications)
    .leftJoin(applications, eq(applications.id, notifications.applicationId))
    .where(eq(notifications.userId, input.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(input.limit ?? NOTIFICATION_PANEL_SIZE);
}

export async function markNotificationReadForUser(input: {
  userId: string;
  publicId: string;
}) {
  const now = new Date();
  const [row] = await db
    .update(notifications)
    .set({ readAt: now, updatedAt: now })
    .where(
      and(
        eq(notifications.userId, input.userId),
        eq(notifications.publicId, input.publicId),
        isNull(notifications.readAt),
      ),
    )
    .returning({ publicId: notifications.publicId });

  return row ?? null;
}

export async function markAllNotificationsReadForUser(userId: string) {
  const now = new Date();

  await db
    .update(notifications)
    .set({ readAt: now, updatedAt: now })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

export async function insertNotification(values: NewNotification) {
  const [row] = await db
    .insert(notifications)
    .values(values)
    .returning({ publicId: notifications.publicId });

  return row ?? null;
}
