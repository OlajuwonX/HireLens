import { describe, expect, it } from "vitest";
import { shouldClearUntrustedPassword } from "@/features/auth/policies/account-linking";

const VERIFIED = new Date("2026-01-01T00:00:00Z");

describe("shouldClearUntrustedPassword", () => {
  it("clears a password set on an account whose email was never verified", () => {
    expect(
      shouldClearUntrustedPassword({
        emailVerifiedAt: null,
        passwordHash: "$2a$12$hash",
      }),
    ).toBe(true);
  });

  it("keeps a password once the email is verified", () => {
    expect(
      shouldClearUntrustedPassword({
        emailVerifiedAt: VERIFIED,
        passwordHash: "$2a$12$hash",
      }),
    ).toBe(false);
  });

  it("does nothing for a Google-only account", () => {
    expect(
      shouldClearUntrustedPassword({
        emailVerifiedAt: null,
        passwordHash: null,
      }),
    ).toBe(false);
  });

  it("does nothing for a verified account with no password", () => {
    expect(
      shouldClearUntrustedPassword({
        emailVerifiedAt: VERIFIED,
        passwordHash: null,
      }),
    ).toBe(false);
  });
});
