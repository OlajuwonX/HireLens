import { NOTIFICATION_BADGE_CAP } from "./constants";

export type NotificationSource = {
  publicId: string;
  title: string;
  body: string | null;
  readAt: Date | null;
  createdAt: Date;
  applicationPublicId: string | null;
};

export type NotificationItem = {
  publicId: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
  href: string | null;
};

export function toNotificationItem(row: NotificationSource): NotificationItem {
  return {
    publicId: row.publicId,
    title: row.title,
    body: row.body,
    read: row.readAt !== null,
    createdAt: row.createdAt.toISOString(),
    href: row.applicationPublicId
      ? `/dashboard/jobs?open=${row.applicationPublicId}`
      : null,
  };
}

export function formatUnreadBadge(count: number) {
  if (!Number.isFinite(count) || count <= 0) {
    return null;
  }

  return count > NOTIFICATION_BADGE_CAP
    ? `${NOTIFICATION_BADGE_CAP}+`
    : String(Math.floor(count));
}

export function formatRelativeTime(iso: string, now = Date.now()) {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return "";
  }

  const formatter = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });
  const minutes = Math.round((then - now) / 60_000);

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);

  if (Math.abs(hours) < 24) {
    return formatter.format(hours, "hour");
  }

  return formatter.format(Math.round(hours / 24), "day");
}
