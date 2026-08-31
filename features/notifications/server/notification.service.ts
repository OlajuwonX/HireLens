import "server-only";

import * as Sentry from "@sentry/nextjs";
import type { NotificationKind } from "../constants";
import {
  toNotificationItem,
  type NotificationItem,
} from "../notification-item";
import {
  countUnreadNotifications,
  insertNotification,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "./notification.repository";

export type { NotificationItem };

export async function getUnreadNotificationCount(userId: string) {
  return countUnreadNotifications(userId);
}

export async function getNotificationPanel(
  userId: string,
): Promise<NotificationItem[]> {
  const rows = await listNotificationsForUser({ userId });

  return rows.map(toNotificationItem);
}

export async function readNotification(input: {
  userId: string;
  publicId: string;
}) {
  await markNotificationReadForUser(input);
}

export async function readAllNotifications(userId: string) {
  await markAllNotificationsReadForUser(userId);
}

export async function notifyUser(input: {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  applicationId?: string | null;
}) {
  try {
    await insertNotification({
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      applicationId: input.applicationId ?? null,
    });

    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { source: "notification-create" },
    });

    return false;
  }
}
