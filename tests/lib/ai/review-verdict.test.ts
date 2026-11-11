import { describe, expect, it } from "vitest";
import { measureChange } from "@/lib/ai/resume-diff";
import { finalVerdict } from "@/lib/ai/review-verdict";
import type { ResumeReview, ReviewIssue } from "@/lib/ai/schemas/resume-review.schema";

const clean = { issues: [], errorCount: 0 };

function review(verdict: ResumeReview["verdict"], issues: Partial<ReviewIssue>[] = []): ResumeReview {
  return {
    verdict,
    scores: {
      factualAccuracy: 98,
      requirementCoverage: 95,
      keywordRelevance: 95,
      bulletQuality: 95,
      readability: 95,
      atsStructure: 95,
    },
    issues: issues.map((issue) => ({
      severity: "MINOR",
      category: "READABILITY",
      location: "",
      problem: "x",
      fix: "",
      ...issue,
    })),
    summary: "ok",
  };
}

describe("finalVerdict", () => {
  it("approves a clean review", () => {
    expect(finalVerdict(review("APPROVED"), clean)).toBe("APPROVED");
  });

  it("rejects a critical issue even when the model approved with high scores", () => {
    expect(
      finalVerdict(review("APPROVED", [{ severity: "CRITICAL", category: "FABRICATION" }]), clean),
    ).toBe("REJECTED");
  });

  it("asks for changes on a major issue", () => {
    expect(finalVerdict(review("APPROVED", [{ severity: "MAJOR" }]), clean)).toBe("NEEDS_CHANGES");
  });

  it("rejects when deterministic checks found errors, whatever the model said", () => {
    expect(finalVerdict(review("APPROVED"), { issues: [], errorCount: 1 })).toBe("REJECTED");
  });

  it("keeps the model's stricter verdict", () => {
    expect(finalVerdict(review("NEEDS_CHANGES"), clean)).toBe("NEEDS_CHANGES");
  });
});

describe("measureChange", () => {
  it("is zero for identical text and ignores case", () => {
    expect(measureChange("Built React apps", "built react APPS")).toBe(0);
  });

  it("is one for completely different text", () => {
    expect(measureChange("alpha beta", "gamma delta")).toBe(1);
  });

  it("measures the share of words that changed", () => {
    expect(measureChange("a b c d", "a b c e")).toBeCloseTo(0.25);
  });

  it("is zero for two empty texts", () => {
    expect(measureChange("", "")).toBe(0);
  });
});
