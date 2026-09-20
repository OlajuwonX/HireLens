import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

const { insertMock, insertValues } = vi.hoisted(() => {
  const insertValues = vi.fn();
  const insertMock = vi.fn(() => ({ values: insertValues }));
  return { insertMock, insertValues };
});

vi.mock("@/lib/db/client", () => ({
  db: { insert: insertMock },
}));

import { recordAdminAction } from "@/features/admin/server/audit-log";

describe("recordAdminAction", () => {
  it("writes a row on the happy path", async () => {
    insertValues.mockResolvedValueOnce(undefined);

    await recordAdminAction({
      actorId: "actor-1",
      action: "PROMOTE_ADMIN",
      targetType: "user",
      targetId: "target-1",
      metadata: { targetEmail: "a@b.com" },
    });

    expect(insertMock).toHaveBeenCalled();
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "actor-1",
        action: "PROMOTE_ADMIN",
        targetType: "user",
        targetId: "target-1",
      }),
    );
  });

  it("never throws into the caller when the insert fails", async () => {
    insertValues.mockRejectedValueOnce(new Error("insert failed"));

    await expect(
      recordAdminAction({
        actorId: "actor-1",
        action: "DISABLE_USER",
        targetType: "user",
        targetId: "target-1",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("retrofitted admin actions record their audit entry", () => {
  it("promote/revoke/disable/enable all call recordAdminAction", () => {
    const source = readFileSync(
      "features/admin/actions/user-admin-actions.ts",
      "utf8",
    );

    const calls = source.match(/recordAdminAction\(/g) ?? [];

    expect(calls.length).toBe(4);
  });

  it("the bug-status action calls recordAdminAction", () => {
    const source = readFileSync(
      "features/bug-reports/actions/bug-report-actions.ts",
      "utf8",
    );

    expect(source).toContain("recordAdminAction(");
  });
});
