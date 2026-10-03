import { PgDialect } from "drizzle-orm/pg-core";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const returning = vi.fn();
  const where = vi.fn((_condition: unknown) => ({ returning }));
  const del = vi.fn(() => ({ where }));

  return {
    returning,
    where,
    del,
    isImpersonating: vi.fn(),
    requireDatabaseUser: vi.fn(),
    revalidatePath: vi.fn(),
    removeNotificationForUser: vi.fn(),
    removeAllNotificationsForUser: vi.fn(),
  };
});

vi.mock("@/lib/db/client", () => ({ db: { delete: mocks.del } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/features/auth/server/impersonation", () => ({
  isImpersonating: mocks.isImpersonating,
}));
vi.mock("@/features/auth/server/require-database-user", () => ({
  requireDatabaseUser: mocks.requireDatabaseUser,
}));
vi.mock("@/features/notifications/server/notification.service", () => ({
  getNotificationPanel: vi.fn(),
  readAllNotifications: vi.fn(),
  readNotification: vi.fn(),
  removeNotificationForUser: mocks.removeNotificationForUser,
  removeAllNotificationsForUser: mocks.removeAllNotificationsForUser,
}));

const { deleteNotificationForUser, deleteAllNotificationsForUser } =
  await vi.importActual<
    typeof import("@/features/notifications/server/notification.repository")
  >("@/features/notifications/server/notification.repository");

const { deleteNotificationAction, clearAllNotificationsAction } = await import(
  "@/features/notifications/actions/notification-actions"
);

const dialect = new PgDialect();
const uuid = "b1f0c4a2-0000-4000-8000-000000000001";

function lastWhere() {
  const calls = mocks.where.mock.calls;

  return dialect.sqlToQuery(calls[calls.length - 1][0] as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.returning.mockResolvedValue([]);
  mocks.isImpersonating.mockResolvedValue(false);
  mocks.requireDatabaseUser.mockResolvedValue({ id: "user-1" });
});

describe("repository scoping", () => {
  it("delete-one filters on both the user and the public id", async () => {
    await deleteNotificationForUser({ userId: "user-1", publicId: uuid });

    const query = lastWhere();

    expect(query.sql).toContain('"user_id" = $1');
    expect(query.sql).toContain('"public_id" = $2');
    expect(query.sql).toContain(" and ");
    expect(query.params).toEqual(["user-1", uuid]);
  });

  it("delete-one cannot be reached with a public id alone", () => {
    const source = readFileSync(
      "features/notifications/server/notification.repository.ts",
      "utf8",
    );
    const block = source.slice(source.indexOf("deleteNotificationForUser"));

    expect(block).toContain("eq(notifications.userId, input.userId)");
  });

  it("clear-all filters on the user only, and never deletes unscoped", async () => {
    mocks.returning.mockResolvedValue([{ publicId: "a" }, { publicId: "b" }]);

    const removed = await deleteAllNotificationsForUser("user-1");
    const query = lastWhere();

    expect(removed).toBe(2);
    expect(query.sql).toContain('"user_id" = $1');
    expect(query.params).toEqual(["user-1"]);
    expect(mocks.where).toHaveBeenCalledTimes(1);
  });

  it("returns null when nothing matched", async () => {
    await expect(
      deleteNotificationForUser({ userId: "user-1", publicId: uuid }),
    ).resolves.toBeNull();
  });
});

describe("deleteNotificationAction", () => {
  it("deletes for the signed-in user and revalidates the layout", async () => {
    const result = await deleteNotificationAction(uuid);

    expect(result).toEqual({ ok: true });
    expect(mocks.removeNotificationForUser).toHaveBeenCalledWith({
      userId: "user-1",
      publicId: uuid,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard", "layout");
  });

  it("rejects a malformed id without touching the database", async () => {
    const result = await deleteNotificationAction("not-a-uuid");

    expect(result).toMatchObject({ ok: false });
    expect(mocks.removeNotificationForUser).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("is blocked while impersonating, before resolving any user", async () => {
    mocks.isImpersonating.mockResolvedValue(true);

    const result = await deleteNotificationAction(uuid);

    expect(result).toEqual({
      ok: false,
      message: "Unavailable while impersonating a user.",
    });
    expect(mocks.requireDatabaseUser).not.toHaveBeenCalled();
    expect(mocks.removeNotificationForUser).not.toHaveBeenCalled();
  });

  it("propagates the auth redirect when there is no session", async () => {
    mocks.requireDatabaseUser.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(deleteNotificationAction(uuid)).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(mocks.removeNotificationForUser).not.toHaveBeenCalled();
  });
});

describe("clearAllNotificationsAction", () => {
  it("clears for the signed-in user and revalidates the layout", async () => {
    const result = await clearAllNotificationsAction();

    expect(result).toEqual({ ok: true });
    expect(mocks.removeAllNotificationsForUser).toHaveBeenCalledWith("user-1");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard", "layout");
  });

  it("is blocked while impersonating", async () => {
    mocks.isImpersonating.mockResolvedValue(true);

    const result = await clearAllNotificationsAction();

    expect(result).toMatchObject({ ok: false });
    expect(mocks.removeAllNotificationsForUser).not.toHaveBeenCalled();
  });
});
