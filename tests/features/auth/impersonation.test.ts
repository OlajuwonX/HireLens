import { describe, expect, it, vi } from "vitest";

const { authMock, getAccountRecordMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAccountRecordMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/features/auth/server/current-account", () => ({
  getAccountRecord: getAccountRecordMock,
}));

import {
  assertNotImpersonating,
  getActiveImpersonation,
  getImpersonationBannerData,
  isImpersonating,
} from "@/features/auth/server/impersonation";

describe("getActiveImpersonation", () => {
  it("returns null when there is no session", async () => {
    authMock.mockResolvedValueOnce(null);
    await expect(getActiveImpersonation()).resolves.toBeNull();
  });

  it("returns null when the session has no impersonation claim", async () => {
    authMock.mockResolvedValueOnce({ impersonation: null });
    await expect(getActiveImpersonation()).resolves.toBeNull();
  });

  it("returns the claim when one is active", async () => {
    const claim = {
      actingAdminId: "admin-1",
      targetUserId: "user-2",
      expiresAt: new Date().toISOString(),
    };
    authMock.mockResolvedValueOnce({ impersonation: claim });
    await expect(getActiveImpersonation()).resolves.toEqual(claim);
  });
});

describe("isImpersonating / assertNotImpersonating", () => {
  it("isImpersonating is false with no active claim", async () => {
    authMock.mockResolvedValueOnce({ impersonation: null });
    await expect(isImpersonating()).resolves.toBe(false);
  });

  it("assertNotImpersonating does not throw when inactive", async () => {
    authMock.mockResolvedValueOnce({ impersonation: null });
    await expect(assertNotImpersonating()).resolves.toBeUndefined();
  });

  it("assertNotImpersonating throws when an impersonation is active", async () => {
    authMock.mockResolvedValueOnce({
      impersonation: {
        actingAdminId: "admin-1",
        targetUserId: "user-2",
        expiresAt: new Date().toISOString(),
      },
    });
    await expect(assertNotImpersonating()).rejects.toThrow(
      "This action is unavailable while impersonating a user.",
    );
  });
});

describe("getImpersonationBannerData", () => {
  it("returns null when nothing is active", async () => {
    authMock.mockResolvedValueOnce({ impersonation: null });
    await expect(getImpersonationBannerData()).resolves.toBeNull();
  });

  it("returns the target's email and expiry when active", async () => {
    authMock.mockResolvedValueOnce({
      impersonation: {
        actingAdminId: "admin-1",
        targetUserId: "user-2",
        expiresAt: "2026-01-01T00:15:00.000Z",
      },
    });
    getAccountRecordMock.mockResolvedValueOnce({ email: "target@example.com" });

    await expect(getImpersonationBannerData()).resolves.toEqual({
      targetEmail: "target@example.com",
      expiresAt: "2026-01-01T00:15:00.000Z",
    });
  });

  it("returns null when the target account no longer exists", async () => {
    authMock.mockResolvedValueOnce({
      impersonation: {
        actingAdminId: "admin-1",
        targetUserId: "user-2",
        expiresAt: new Date().toISOString(),
      },
    });
    getAccountRecordMock.mockResolvedValueOnce(null);

    await expect(getImpersonationBannerData()).resolves.toBeNull();
  });
});
