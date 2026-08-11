import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AI_BURST_LIMIT,
  AI_USAGE_ACTIONS,
  getDailyAllowance,
  getGlobalDailySafetyLimit,
  usageActionLabels,
} from "@/lib/ai/usage";

const original = { ...process.env };

beforeEach(() => {
  process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/hirelens";
});

afterEach(() => {
  process.env = { ...original };
});

describe("usage actions", () => {
  it("stays a small, explicit action set", () => {
    expect(AI_USAGE_ACTIONS).toEqual([
      "APPLICATION_ANALYSIS",
      "APPLICATION_REGENERATE",
      "JOB_EXTRACTION",
    ]);
  });

  it("labels every action", () => {
    for (const action of AI_USAGE_ACTIONS) {
      expect(usageActionLabels[action]).toBeTruthy();
    }
  });
});

describe("daily allowances", () => {
  it("defaults to three analyses and one regenerate a day", () => {
    expect(getDailyAllowance("APPLICATION_ANALYSIS")).toBe(3);
    expect(getDailyAllowance("APPLICATION_REGENERATE")).toBe(1);
    expect(getDailyAllowance("JOB_EXTRACTION")).toBe(3);
  });

  it("defaults the global safety limit below a twenty-request provider cap", () => {
    expect(getGlobalDailySafetyLimit()).toBe(18);
    expect(getGlobalDailySafetyLimit()).toBeLessThan(20);
  });

  it("keeps the burst limit small", () => {
    expect(AI_BURST_LIMIT).toBe(3);
  });
});

describe("the whole day's allowance stays under the safety limit", () => {
  it("cannot exceed the global cap through per-action limits alone", () => {
    const total = AI_USAGE_ACTIONS.reduce(
      (sum, action) => sum + getDailyAllowance(action),
      0,
    );

    expect(total).toBeLessThanOrEqual(getGlobalDailySafetyLimit());
  });
});
