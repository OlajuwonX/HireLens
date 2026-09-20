import { describe, expect, it } from "vitest";
import { isClaimExpired } from "@/features/auth/impersonation-token";

describe("isClaimExpired", () => {
  it("is not expired when the deadline is in the future", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isClaimExpired(future, new Date())).toBe(false);
  });

  it("is expired when the deadline has passed", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isClaimExpired(past, new Date())).toBe(true);
  });

  it("is expired when there is no deadline at all", () => {
    expect(isClaimExpired(undefined, new Date())).toBe(true);
  });

  it("treats the exact deadline instant as expired", () => {
    const now = new Date();
    expect(isClaimExpired(now.toISOString(), now)).toBe(true);
  });
});
