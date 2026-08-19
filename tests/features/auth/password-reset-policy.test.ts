import {
  isResetTokenExpired,
  RESET_RESEND_COOLDOWN_MINUTES,
  RESET_TOKEN_TTL_MINUTES,
  resendCooldownThreshold,
  resetTokenExpiry,
} from "@/features/auth/policies/password-reset";
import { describe, expect, it } from "vitest";

const NOW = new Date("2026-08-19T12:00:00Z");
const MINUTE = 60_000;

describe("resetTokenExpiry", () => {
  it("expires a token half an hour after it is issued", () => {
    expect(resetTokenExpiry(NOW).toISOString()).toBe(
      "2026-08-19T12:30:00.000Z",
    );
  });

  it("matches the advertised lifetime", () => {
    const minutes = (resetTokenExpiry(NOW).getTime() - NOW.getTime()) / MINUTE;

    expect(minutes).toBe(RESET_TOKEN_TTL_MINUTES);
  });
});

describe("resendCooldownThreshold", () => {
  it("treats a token issued moments ago as still within the cooldown", () => {
    const justIssued = resetTokenExpiry(NOW);

    expect(justIssued.getTime()).toBeGreaterThan(
      resendCooldownThreshold(NOW).getTime(),
    );
  });

  it("lets a new link be sent once the cooldown has passed", () => {
    const issuedEarlier = resetTokenExpiry(NOW);
    const later = new Date(
      NOW.getTime() + RESET_RESEND_COOLDOWN_MINUTES * MINUTE + 1000,
    );

    expect(issuedEarlier.getTime()).toBeLessThan(
      resendCooldownThreshold(later).getTime(),
    );
  });

  it("never lets the cooldown outlive the token itself", () => {
    expect(resendCooldownThreshold(NOW).getTime()).toBeLessThan(
      resetTokenExpiry(NOW).getTime(),
    );
  });
});

describe("isResetTokenExpired", () => {
  it("accepts a token with time left", () => {
    expect(isResetTokenExpired(new Date(NOW.getTime() + MINUTE), NOW)).toBe(
      false,
    );
  });

  it("rejects a token that has run out", () => {
    expect(isResetTokenExpired(new Date(NOW.getTime() - 1), NOW)).toBe(true);
  });

  it("rejects a token expiring exactly now", () => {
    expect(isResetTokenExpired(NOW, NOW)).toBe(true);
  });
});
