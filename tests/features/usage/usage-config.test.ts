import {
  AI_BURST_LIMIT,
  AI_USAGE_ACTIONS,
  getDailyAllowance,
  getGlobalDailySafetyLimit,
  getInterviewPoolGlobalDailyLimit,
  usageActionLabels,
} from "@/lib/ai/usage";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

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
      "INTERVIEW_POOL_GENERATION",
      "RESUME_REVIEW",
      "JOB_MATCHING",
      "INTERVIEW_PREP",
    ]);
  });

  it("labels every action", () => {
    for (const action of AI_USAGE_ACTIONS) {
      expect(usageActionLabels[action]).toBeTruthy();
    }
  });
});

describe("daily allowances", () => {
  it("allows three matching batches a day by default", () => {
    expect(getDailyAllowance("JOB_MATCHING")).toBe(3);
  });

  it("allows five independent reviews a day by default", () => {
    expect(getDailyAllowance("RESUME_REVIEW")).toBe(5);
  });

  it("defaults to fifteen analyses and three regenerates a day", () => {
    expect(getDailyAllowance("APPLICATION_ANALYSIS")).toBe(15);
    expect(getDailyAllowance("APPLICATION_REGENERATE")).toBe(3);
    expect(getDailyAllowance("JOB_EXTRACTION")).toBe(3);
    expect(getDailyAllowance("INTERVIEW_POOL_GENERATION")).toBe(2);
  });

  it("reads env overrides even when the value is quoted", () => {
    process.env.AI_DAILY_APPLICATION_ANALYSIS_LIMIT = '"12"';
    process.env.AI_DAILY_REGENERATE_LIMIT = " 2 ";
    expect(getDailyAllowance("APPLICATION_ANALYSIS")).toBe(12);
    expect(getDailyAllowance("APPLICATION_REGENERATE")).toBe(2);
  });

  it("keeps the shared cap inside the free provider allowance", () => {
    expect(getGlobalDailySafetyLimit()).toBe(40);
  });

  it("caps interview pool generation with a small shared daily budget", () => {
    expect(getInterviewPoolGlobalDailyLimit()).toBe(8);
    expect(getInterviewPoolGlobalDailyLimit()).toBeLessThan(
      getGlobalDailySafetyLimit(),
    );
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
