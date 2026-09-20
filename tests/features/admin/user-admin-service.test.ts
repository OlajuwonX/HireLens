import { describe, expect, it } from "vitest";
import {
  AdminActionError,
  assertCanDisable,
  assertCanRevokeAdmin,
} from "@/features/admin/server/user-admin.service";

describe("assertCanRevokeAdmin", () => {
  it("is a no-op when the target is not an admin", () => {
    expect(
      assertCanRevokeAdmin({ target: { role: "USER" }, adminCount: 5 }),
    ).toBe(false);
  });

  it("allows revoking when another admin remains", () => {
    expect(
      assertCanRevokeAdmin({ target: { role: "ADMIN" }, adminCount: 2 }),
    ).toBe(true);
  });

  it("blocks revoking the last remaining admin", () => {
    expect(() =>
      assertCanRevokeAdmin({ target: { role: "ADMIN" }, adminCount: 1 }),
    ).toThrow(AdminActionError);
  });
});

describe("assertCanDisable", () => {
  it("blocks an admin from disabling their own account", () => {
    expect(() =>
      assertCanDisable({ target: { id: "user-1" }, actingAdminId: "user-1" }),
    ).toThrow(AdminActionError);
  });

  it("allows disabling a different account", () => {
    expect(() =>
      assertCanDisable({ target: { id: "user-2" }, actingAdminId: "user-1" }),
    ).not.toThrow();
  });
});
