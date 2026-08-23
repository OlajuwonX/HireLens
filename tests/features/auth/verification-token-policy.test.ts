import {
  emailForPurpose,
  isTokenExpired,
  RESEND_COOLDOWN_MINUTES,
  resendCooldownThreshold,
  scopedIdentifier,
  TOKEN_PURPOSES,
  TOKEN_TTL_MINUTES,
  tokenExpiry,
} from "@/features/auth/policies/verification-token";
import { describe, expect, it } from "vitest";

const NOW = new Date("2026-08-19T12:00:00Z");
const MINUTE = 60_000;

describe("scopedIdentifier", () => {
  it("keeps a reset token and a verify token apart", () => {
    expect(scopedIdentifier("reset", "ada@example.com")).not.toBe(
      scopedIdentifier("verify", "ada@example.com"),
    );
  });

  it("round-trips the address for its own purpose", () => {
    for (const purpose of TOKEN_PURPOSES) {
      const identifier = scopedIdentifier(purpose, "ada@example.com");

      expect(emailForPurpose(purpose, identifier)).toBe("ada@example.com");
    }
  });
});

describe("emailForPurpose", () => {
  it("refuses a token issued for a different purpose", () => {
    const verifyToken = scopedIdentifier("verify", "ada@example.com");

    expect(emailForPurpose("reset", verifyToken)).toBeNull();
  });

  it("refuses a bare address with no purpose", () => {
    expect(emailForPurpose("reset", "ada@example.com")).toBeNull();
  });

  it("refuses a prefix with no address behind it", () => {
    expect(emailForPurpose("reset", "reset:")).toBeNull();
  });
});

describe("tokenExpiry", () => {
  it("gives a reset link half an hour", () => {
    expect((tokenExpiry("reset", NOW).getTime() - NOW.getTime()) / MINUTE).toBe(
      TOKEN_TTL_MINUTES.reset,
    );
  });

  it("gives a confirmation link a full day, because people read email later", () => {
    expect(
      (tokenExpiry("verify", NOW).getTime() - NOW.getTime()) / MINUTE,
    ).toBe(60 * 24);
  });
});

describe("resendCooldownThreshold", () => {
  it.each(TOKEN_PURPOSES)("suppresses a duplicate %s email", (purpose) => {
    const justIssued = tokenExpiry(purpose, NOW);

    expect(justIssued.getTime()).toBeGreaterThan(
      resendCooldownThreshold(purpose, NOW).getTime(),
    );
  });

  it.each(TOKEN_PURPOSES)(
    "lets a %s email through after the wait",
    (purpose) => {
      const issuedEarlier = tokenExpiry(purpose, NOW);
      const later = new Date(
        NOW.getTime() + RESEND_COOLDOWN_MINUTES * MINUTE + 1000,
      );

      expect(issuedEarlier.getTime()).toBeLessThan(
        resendCooldownThreshold(purpose, later).getTime(),
      );
    },
  );
});

describe("isTokenExpired", () => {
  it("accepts a token with time left", () => {
    expect(isTokenExpired(new Date(NOW.getTime() + MINUTE), NOW)).toBe(false);
  });

  it("rejects one that has run out", () => {
    expect(isTokenExpired(new Date(NOW.getTime() - 1), NOW)).toBe(true);
  });

  it("rejects one expiring exactly now", () => {
    expect(isTokenExpired(NOW, NOW)).toBe(true);
  });
});
