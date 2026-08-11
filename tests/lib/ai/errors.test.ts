import { describe, expect, it } from "vitest";
import {
  aiFailureMessage,
  classifyAiFailure,
  describeAiFailure,
} from "@/lib/ai/errors";

const dailyQuotaError = Object.assign(
  new Error(
    '{"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details.\\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}]}}',
  ),
  { name: "ApiError", status: 429 },
);

const perMinuteError = Object.assign(
  new Error(
    '{"error":{"code":429,"message":"Quota exceeded","status":"RESOURCE_EXHAUSTED","details":[{"violations":[{"quotaId":"GenerateRequestsPerMinutePerProject"}]}]}}',
  ),
  { name: "ApiError", status: 429 },
);

const overloadedError = Object.assign(
  new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}'),
  { name: "ApiError", status: 503 },
);

describe("classifyAiFailure", () => {
  it("identifies the free-tier daily cap", () => {
    expect(classifyAiFailure(dailyQuotaError)).toBe("DAILY_QUOTA");
  });

  it("identifies a per-minute rate limit", () => {
    expect(classifyAiFailure(perMinuteError)).toBe("RATE_LIMIT");
  });

  it("identifies an overloaded service", () => {
    expect(classifyAiFailure(overloadedError)).toBe("OVERLOADED");
  });

  it("leaves anything else unknown", () => {
    expect(classifyAiFailure(new Error("boom"))).toBe("UNKNOWN");
    expect(classifyAiFailure(null)).toBe("UNKNOWN");
  });
});

describe("aiFailureMessage", () => {
  it("does not tell the user to retry when the daily cap is spent", () => {
    const message = aiFailureMessage(dailyQuotaError, "Try again.");

    expect(message).toContain("tomorrow");
    expect(message).not.toBe("Try again.");
  });

  it("falls back for unrecognised failures", () => {
    expect(aiFailureMessage(new Error("boom"), "Try again.")).toBe("Try again.");
  });
});

describe("describeAiFailure", () => {
  it("keeps the message, not just the error name", () => {
    const described = describeAiFailure(new Error("Failed query: insert into x"));

    expect(described).toContain("Failed query: insert into x");
  });

  it("caps runaway payloads", () => {
    expect(describeAiFailure(new Error("x".repeat(5_000))).length).toBe(1_000);
  });

  it("handles non-errors", () => {
    expect(describeAiFailure("nope")).toBe("Unknown AI failure");
  });
});
