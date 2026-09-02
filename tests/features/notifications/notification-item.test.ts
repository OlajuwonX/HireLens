import { describe, expect, it } from "vitest";
import { NOTIFICATION_BADGE_CAP } from "@/features/notifications/constants";
import {
  formatRelativeTime,
  formatUnreadBadge,
  toNotificationItem,
} from "@/features/notifications/notification-item";

const base = {
  publicId: "b1f0c4a2-0000-4000-8000-000000000001",
  title: "Interview update",
  body: "Google invited you to an interview.",
  readAt: null,
  createdAt: new Date("2026-08-31T10:00:00.000Z"),
  applicationPublicId: null,
};

describe("toNotificationItem", () => {
  it("marks a row with no readAt as unread", () => {
    expect(toNotificationItem(base).read).toBe(false);
  });

  it("marks a row with a readAt as read", () => {
    const item = toNotificationItem({ ...base, readAt: new Date() });

    expect(item.read).toBe(true);
  });

  it("links to the application drawer when one is attached", () => {
    const item = toNotificationItem({
      ...base,
      applicationPublicId: "aaaaaaaa-0000-4000-8000-000000000002",
    });

    expect(item.href).toBe(
      "/dashboard/jobs?open=aaaaaaaa-0000-4000-8000-000000000002",
    );
  });

  it("has no link when the notification is not tied to an application", () => {
    expect(toNotificationItem(base).href).toBeNull();
  });

  it("serialises createdAt so it can cross the server boundary", () => {
    expect(toNotificationItem(base).createdAt).toBe(
      "2026-08-31T10:00:00.000Z",
    );
  });
});

describe("formatUnreadBadge", () => {
  it("hides the badge when nothing is unread", () => {
    expect(formatUnreadBadge(0)).toBeNull();
    expect(formatUnreadBadge(-3)).toBeNull();
  });

  it("shows the exact count up to the cap", () => {
    expect(formatUnreadBadge(1)).toBe("1");
    expect(formatUnreadBadge(NOTIFICATION_BADGE_CAP)).toBe(
      String(NOTIFICATION_BADGE_CAP),
    );
  });

  it("caps larger counts", () => {
    expect(formatUnreadBadge(NOTIFICATION_BADGE_CAP + 1)).toBe(
      `${NOTIFICATION_BADGE_CAP}+`,
    );
    expect(formatUnreadBadge(999)).toBe(`${NOTIFICATION_BADGE_CAP}+`);
  });

  it("ignores values that are not real counts", () => {
    expect(formatUnreadBadge(Number.NaN)).toBeNull();
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-31T12:00:00.000Z").getTime();

  it("reports minutes within the hour", () => {
    const value = formatRelativeTime("2026-08-31T11:30:00.000Z", now);

    expect(value).toMatch(/30/);
  });

  it("reports hours within the day", () => {
    const value = formatRelativeTime("2026-08-31T06:00:00.000Z", now);

    expect(value).toMatch(/6/);
  });

  it("reports days beyond that", () => {
    const value = formatRelativeTime("2026-08-28T12:00:00.000Z", now);

    expect(value).toMatch(/3/);
  });

  it("returns an empty string for an unparseable timestamp", () => {
    expect(formatRelativeTime("not-a-date", now)).toBe("");
  });
});
