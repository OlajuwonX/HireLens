import type { NotificationItem } from "./notification-item";

export function removeNotification(
  items: NotificationItem[],
  publicId: string,
): { items: NotificationItem[]; removed: NotificationItem | null } {
  const removed = items.find((item) => item.publicId === publicId) ?? null;

  return {
    items: removed
      ? items.filter((item) => item.publicId !== publicId)
      : items,
    removed,
  };
}

export function restoreNotification(
  items: NotificationItem[],
  item: NotificationItem,
): NotificationItem[] {
  if (items.some((entry) => entry.publicId === item.publicId)) {
    return items;
  }

  return [...items, item].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function unreadAfterRemoval(
  unread: number,
  removed: NotificationItem | null,
) {
  return removed && !removed.read ? Math.max(0, unread - 1) : unread;
}

export function unreadAfterRestore(unread: number, item: NotificationItem) {
  return item.read ? unread : unread + 1;
}

export const CLEAR_ALL_CONFIRM_COPY =
  "Delete all your notifications, including any not shown here? This cannot be undone.";
