import { isSessionRevoked } from "@/features/auth/session-revocation";
import { describe, expect, it } from "vitest";

const changedAt = new Date("2026-10-01T12:00:00Z");

describe("isSessionRevoked", () => {
  it("keeps sessions when the password was never changed", () => {
    expect(isSessionRevoked({ passwordChangedAt: null }, null)).toBe(false);
    expect(isSessionRevoked({ passwordChangedAt: null }, 0)).toBe(false);
  });

  it("revokes sessions signed in before the change", () => {
    const before = changedAt.getTime() - 1;

    expect(isSessionRevoked({ passwordChangedAt: changedAt }, before)).toBe(
      true,
    );
  });

  it("keeps sessions signed in at or after the change", () => {
    const after = changedAt.getTime() + 1_000;

    expect(
      isSessionRevoked({ passwordChangedAt: changedAt }, changedAt.getTime()),
    ).toBe(false);
    expect(isSessionRevoked({ passwordChangedAt: changedAt }, after)).toBe(
      false,
    );
  });

  it("revokes older sessions that carry no sign-in time", () => {
    expect(isSessionRevoked({ passwordChangedAt: changedAt }, null)).toBe(true);
    expect(isSessionRevoked({ passwordChangedAt: changedAt }, undefined)).toBe(
      true,
    );
  });
});
