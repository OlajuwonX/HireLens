import { describe, expect, it } from "vitest";
import {
  isUsageDenialReason,
  readUsageDenialReason,
  usageDenialReasons,
  usageLimitMessage,
} from "@/features/usage/limit-notice";

describe("every limit a user can hit has a message", () => {
  it("covers all four denial reasons", () => {
    expect([...usageDenialReasons].sort()).toEqual([
      "ACTIVE_REQUEST",
      "BURST_LIMIT",
      "DAILY_LIMIT",
      "GLOBAL_LIMIT",
    ]);
  });

  it.each(usageDenialReasons)("%s reads as a sentence to a user", (reason) => {
    const message = usageLimitMessage(reason);

    expect(message.length).toBeGreaterThan(20);
    expect(message.endsWith(".")).toBe(true);
    expect(message).not.toContain("_");
  });

  it("tells the user when the daily allowance comes back", () => {
    expect(usageLimitMessage("DAILY_LIMIT")).toContain("allowance");
    expect(usageLimitMessage("DAILY_LIMIT")).toContain("midnight UTC");
  });

  it("distinguishes a shared budget from a personal one", () => {
    expect(usageLimitMessage("GLOBAL_LIMIT")).toContain("shared");
    expect(usageLimitMessage("GLOBAL_LIMIT")).not.toBe(
      usageLimitMessage("DAILY_LIMIT"),
    );
  });

  it("tells the user to wait rather than retry when one is already running", () => {
    expect(usageLimitMessage("ACTIVE_REQUEST")).toContain("already running");
  });
});

describe("reading a denial reason off an untrusted query string", () => {
  it("accepts a real reason", () => {
    expect(readUsageDenialReason("DAILY_LIMIT")).toBe("DAILY_LIMIT");
    expect(isUsageDenialReason("BURST_LIMIT")).toBe(true);
  });

  it("rejects anything else", () => {
    for (const value of [
      "daily_limit",
      "NOPE",
      "",
      null,
      undefined,
      42,
      ["DAILY_LIMIT"],
      { reason: "DAILY_LIMIT" },
    ]) {
      expect(readUsageDenialReason(value)).toBeNull();
    }
  });
});
