import { describe, expect, it } from "vitest";
import {
  AI_BURST_LIMIT,
  AI_BURST_WINDOW_SECONDS,
  defaultDailyAllowance,
  usageActionLabels,
} from "@/features/usage/constants";

describe("usage limits", () => {
  it("keeps the burst limit at three requests per minute", () => {
    expect(AI_BURST_LIMIT).toBe(3);
    expect(AI_BURST_WINDOW_SECONDS).toBe(60);
  });

  it("defines allowances for every usage action", () => {
    expect(defaultDailyAllowance.JOB_ANALYSIS).toBe(10);
    expect(defaultDailyAllowance.COVER_LETTER).toBe(5);
    expect(defaultDailyAllowance.APPLICATION_MESSAGE).toBe(15);
    expect(defaultDailyAllowance.IMPROVED_RESUME).toBeGreaterThan(0);
    expect(Object.keys(defaultDailyAllowance).sort()).toEqual(
      Object.keys(usageActionLabels).sort(),
    );
  });
});
