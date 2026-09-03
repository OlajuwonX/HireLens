import { describe, expect, it } from "vitest";
import {
  ACCOUNT_STATES,
  BLOCKED_ACCOUNT_ROUTES,
  blockedAccountRoute,
  isActiveAccount,
  resolveAccountState,
} from "@/features/auth/account-state";

const active = { disabledAt: null, deletedAt: null };

describe("resolveAccountState", () => {
  it("treats an account with no lifecycle timestamps as active", () => {
    expect(resolveAccountState(active)).toBe("ACTIVE");
    expect(isActiveAccount(active)).toBe(true);
  });

  it("treats a paused account as disabled", () => {
    const state = resolveAccountState({
      disabledAt: new Date("2026-09-01T00:00:00.000Z"),
      deletedAt: null,
    });

    expect(state).toBe("DISABLED");
  });

  it("treats a requested deletion as deletion pending", () => {
    const state = resolveAccountState({
      disabledAt: null,
      deletedAt: new Date("2026-09-01T00:00:00.000Z"),
    });

    expect(state).toBe("DELETION_PENDING");
  });

  it("lets deletion outrank disablement when both are set", () => {
    const state = resolveAccountState({
      disabledAt: new Date("2026-09-01T00:00:00.000Z"),
      deletedAt: new Date("2026-09-02T00:00:00.000Z"),
    });

    expect(state).toBe("DELETION_PENDING");
  });

  it("keeps every existing production row active", () => {
    expect(isActiveAccount({ disabledAt: null, deletedAt: null })).toBe(true);
  });
});

describe("blockedAccountRoute", () => {
  it("gives no route to an active account", () => {
    expect(blockedAccountRoute("ACTIVE")).toBeNull();
  });

  it("routes a disabled account to the paused page", () => {
    expect(blockedAccountRoute("DISABLED")).toBe("/account/paused");
  });

  it("routes a deletion-pending account to the scheduled page", () => {
    expect(blockedAccountRoute("DELETION_PENDING")).toBe("/account/scheduled");
  });

  it("has a destination for every non-active state", () => {
    const blocked = ACCOUNT_STATES.filter((state) => state !== "ACTIVE");

    for (const state of blocked) {
      expect(BLOCKED_ACCOUNT_ROUTES).toHaveProperty(state);
      expect(blockedAccountRoute(state)).toMatch(/^\/account\//);
    }
  });

  it("never routes a blocked account back into the dashboard", () => {
    for (const route of Object.values(BLOCKED_ACCOUNT_ROUTES)) {
      expect(route.startsWith("/dashboard")).toBe(false);
      expect(route.startsWith("/sign-in")).toBe(false);
    }
  });
});
