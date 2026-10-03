import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "features/notifications/components/notification-bell.tsx",
  "utf8",
);

describe("notification rows", () => {
  it("keeps the delete button a sibling of the link and button, never nested", () => {
    const row = source.slice(source.indexOf("<li"), source.indexOf("</li>"));
    const linkEnd = row.indexOf("</Link>");
    const buttonEnd = row.indexOf("</button>");
    const deleteAt = row.indexOf("<IconButton");

    expect(deleteAt).toBeGreaterThan(linkEnd);
    expect(deleteAt).toBeGreaterThan(buttonEnd);
    expect(row.slice(0, linkEnd)).not.toContain("<IconButton");
    expect(row.slice(0, linkEnd)).not.toContain("<button");
  });

  it("labels each delete control with the notification title", () => {
    expect(source).toContain("Delete notification: ${item.title}");
  });

  it("announces deletions politely", () => {
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("Notification deleted:");
    expect(source).toContain("All notifications deleted");
  });
});

describe("clear all", () => {
  it("sits below the list, not in the header", () => {
    const clearAt = source.indexOf("Clear all\n");

    expect(clearAt).toBeGreaterThan(source.indexOf("</ul>"));
    expect(clearAt).toBeGreaterThan(source.indexOf("Mark all read"));
  });

  it("only shows when the list is loaded and non-empty", () => {
    expect(source).toContain('status === "ready" && items.length > 0');
  });

  it("asks before deleting and resets the confirmation on close", () => {
    expect(source).toContain("Yes, clear all");
    expect(source).toContain("Keep");
    expect(
      source.match(/setConfirmingClear\(false\)/g)!.length,
    ).toBeGreaterThanOrEqual(4);
  });
});

describe("optimistic updates", () => {
  it("rolls back and toasts an error when the action fails", () => {
    expect(source.match(/notify\.error\(failure\)/g)).toHaveLength(2);
    expect(source).toContain("restoreNotification(current, removed)");
    expect(source).toContain("setUnread(previousUnread)");
  });

  it("treats a thrown action and an ok:false result the same way", () => {
    expect(source.match(/catch \{/g)!.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain("if (!result.ok)");
  });

  it("wraps long unbroken titles and bodies inside the panel", () => {
    const body = source.slice(
      source.indexOf("function NotificationBody"),
      source.indexOf("formatRelativeTime(item.createdAt)"),
    );

    expect(body.match(/wrap-break-word/g)).toHaveLength(2);
  });
});

describe("impersonation banner", () => {
  it("breaks a long email address instead of overflowing", () => {
    const banner = readFileSync(
      "features/admin/components/impersonation-banner.tsx",
      "utf8",
    );

    expect(banner).toMatch(/break-all[^>]*>\{targetEmail\}/);
  });
});
