export const NOTIFICATION_PANEL_SIZE = 20;

export const NOTIFICATION_BADGE_CAP = 9;

export const NOTIFICATION_KINDS = [
  "APPLICATION_UPDATE",
  "FOLLOW_UP_DUE",
  "DEADLINE_NEAR",
  "SYSTEM",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
