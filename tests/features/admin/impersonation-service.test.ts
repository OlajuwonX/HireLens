import { describe, expect, it, vi } from "vitest";

const { findOpenImpersonationSessionByPublicIdMock, getAccountRecordMock } =
  vi.hoisted(() => ({
    findOpenImpersonationSessionByPublicIdMock: vi.fn(),
    getAccountRecordMock: vi.fn(),
  }));

vi.mock("@/features/admin/server/impersonation.repository", () => ({
  findOpenImpersonationSessionByPublicId:
    findOpenImpersonationSessionByPublicIdMock,
}));
vi.mock("@/features/auth/server/current-account", () => ({
  getAccountRecord: getAccountRecordMock,
}));

import {
  assertCanImpersonate,
  resolveImpersonationClaimForUpdate,
} from "@/features/admin/server/impersonation.service";
import { AdminActionError } from "@/features/admin/server/user-admin.service";

function target(overrides: Partial<{
  id: string;
  role: "USER" | "ADMIN";
  deletedAt: Date | null;
  disabledAt: Date | null;
}> = {}) {
  return {
    id: "user-2",
    role: "USER" as const,
    deletedAt: null,
    disabledAt: null,
    ...overrides,
  };
}

describe("assertCanImpersonate", () => {
  it("blocks impersonating yourself", () => {
    expect(() =>
      assertCanImpersonate({
        actorId: "admin-1",
        target: target({ id: "admin-1" }),
      }),
    ).toThrow(AdminActionError);
  });

  it("blocks impersonating another admin", () => {
    expect(() =>
      assertCanImpersonate({
        actorId: "admin-1",
        target: target({ role: "ADMIN" }),
      }),
    ).toThrow(AdminActionError);
  });

  it("blocks impersonating a disabled account", () => {
    expect(() =>
      assertCanImpersonate({
        actorId: "admin-1",
        target: target({ disabledAt: new Date() }),
      }),
    ).toThrow(AdminActionError);
  });

  it("blocks impersonating a deleted account", () => {
    expect(() =>
      assertCanImpersonate({
        actorId: "admin-1",
        target: target({ deletedAt: new Date() }),
      }),
    ).toThrow(AdminActionError);
  });

  it("allows impersonating a different, active, non-admin user", () => {
    expect(() =>
      assertCanImpersonate({ actorId: "admin-1", target: target() }),
    ).not.toThrow();
  });
});

describe("resolveImpersonationClaimForUpdate", () => {
  const futureExpiry = new Date(Date.now() + 60_000);

  it("returns null when no open session matches the public id", async () => {
    findOpenImpersonationSessionByPublicIdMock.mockResolvedValueOnce(null);

    await expect(
      resolveImpersonationClaimForUpdate({
        sessionPublicId: "session-1",
        callerRealUserId: "admin-1",
      }),
    ).resolves.toBeNull();
  });

  it("refuses a session that was not created by the calling identity — the actual fix for the forged-update vulnerability", async () => {
    findOpenImpersonationSessionByPublicIdMock.mockResolvedValueOnce({
      actorUserId: "admin-1",
      targetUserId: "user-2",
      expiresAt: futureExpiry,
    });

    await expect(
      resolveImpersonationClaimForUpdate({
        sessionPublicId: "session-1",
        callerRealUserId: "someone-else",
      }),
    ).resolves.toBeNull();
  });

  it("refuses an expired session even if it was never explicitly ended", async () => {
    findOpenImpersonationSessionByPublicIdMock.mockResolvedValueOnce({
      actorUserId: "admin-1",
      targetUserId: "user-2",
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(
      resolveImpersonationClaimForUpdate({
        sessionPublicId: "session-1",
        callerRealUserId: "admin-1",
      }),
    ).resolves.toBeNull();
  });

  it("refuses when the actor is no longer an admin", async () => {
    findOpenImpersonationSessionByPublicIdMock.mockResolvedValueOnce({
      actorUserId: "admin-1",
      targetUserId: "user-2",
      expiresAt: futureExpiry,
    });
    getAccountRecordMock.mockResolvedValueOnce({
      role: "USER",
      deletedAt: null,
    });

    await expect(
      resolveImpersonationClaimForUpdate({
        sessionPublicId: "session-1",
        callerRealUserId: "admin-1",
      }),
    ).resolves.toBeNull();
  });

  it("resolves the claim when everything checks out", async () => {
    findOpenImpersonationSessionByPublicIdMock.mockResolvedValueOnce({
      actorUserId: "admin-1",
      targetUserId: "user-2",
      expiresAt: futureExpiry,
    });
    getAccountRecordMock.mockResolvedValueOnce({
      role: "ADMIN",
      deletedAt: null,
    });

    await expect(
      resolveImpersonationClaimForUpdate({
        sessionPublicId: "session-1",
        callerRealUserId: "admin-1",
      }),
    ).resolves.toEqual({
      actingAdminId: "admin-1",
      targetUserId: "user-2",
      expiresAt: futureExpiry.toISOString(),
    });
  });
});
