import type { NotificationItem } from "@/features/notifications/notification-item";
import {
  CLEAR_ALL_CONFIRM_COPY,
  removeNotification,
  restoreNotification,
  unreadAfterRemoval,
  unreadAfterRestore,
} from "@/features/notifications/panel-state";
import { describe, expect, it } from "vitest";

const item = (
  id: string,
  minutesAgo: number,
  read = false,
): NotificationItem => ({
  publicId: id,
  title: `Title ${id}`,
  body: null,
  read,
  createdAt: new Date(
    Date.UTC(2026, 8, 26, 12, 0) - minutesAgo * 60_000,
  ).toISOString(),
  href: null,
});

const list = [item("a", 1), item("b", 5, true), item("c", 10)];

describe("removeNotification", () => {
  it("removes only the matching row and returns it", () => {
    const { items, removed } = removeNotification(list, "b");

    expect(items.map((entry) => entry.publicId)).toEqual(["a", "c"]);
    expect(removed?.publicId).toBe("b");
  });

  it("leaves the list untouched for an unknown id", () => {
    const { items, removed } = removeNotification(list, "zzz");

    expect(items).toBe(list);
    expect(removed).toBeNull();
  });

  it("does not mutate the input", () => {
    removeNotification(list, "a");

    expect(list).toHaveLength(3);
  });
});

describe("restoreNotification", () => {
  it("puts a row back in newest-first position", () => {
    const { items, removed } = removeNotification(list, "b");
    const restored = restoreNotification(items, removed!);

    expect(restored.map((entry) => entry.publicId)).toEqual(["a", "b", "c"]);
  });

  it("does not duplicate a row that is already present", () => {
    expect(restoreNotification(list, list[0])).toBe(list);
  });
});

describe("unread bookkeeping", () => {
  it("decrements for an unread removal and never below zero", () => {
    expect(unreadAfterRemoval(3, list[0])).toBe(2);
    expect(unreadAfterRemoval(0, list[0])).toBe(0);
  });

  it("leaves the count alone for a read row or nothing removed", () => {
    expect(unreadAfterRemoval(3, list[1])).toBe(3);
    expect(unreadAfterRemoval(3, null)).toBe(3);
  });

  it("restores the count only for unread rows", () => {
    expect(unreadAfterRestore(2, list[0])).toBe(3);
    expect(unreadAfterRestore(2, list[1])).toBe(2);
  });
});

describe("clear-all copy", () => {
  it("says it removes everything, not just what is shown", () => {
    expect(CLEAR_ALL_CONFIRM_COPY).toMatch(/all/i);
    expect(CLEAR_ALL_CONFIRM_COPY).toMatch(/not shown/i);
    expect(CLEAR_ALL_CONFIRM_COPY).toMatch(/cannot be undone/i);
  });
});
