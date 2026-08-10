import { describe, expect, it } from "vitest";
import {
  analysisRecommendationSchema,
  requirementMatchSchema,
} from "@/lib/ai/schemas/job-fit-analysis.schema";

const modelRecommendation = {
  id: "rec-1",
  category: "CAREER_ALIGNMENT",
  severity: "HIGH" as const,
  problem: "Massive experience gap for a Principal Engineer role.",
  reason: "The posting requires 10+ years of experience.",
  action: "Reposition toward Senior Frontend Engineer roles.",
};

const modelMatch = {
  id: "req-1",
  requirement: "Five years of site management",
  category: "EXPERIENCE" as const,
  importance: "REQUIRED" as const,
  status: "STRONG" as const,
  resumeEvidence: "Ran the Turner site 2019-2024.",
  explanation: "Stated directly on the resume.",
  recommendation: null,
};

function toSuggestionRow(recommendation: typeof modelRecommendation) {
  return {
    category: recommendation.category,
    severity: recommendation.severity,
    problem: recommendation.problem,
    reason: recommendation.reason,
    action: recommendation.action,
  };
}

function toMatchRow(match: typeof modelMatch) {
  return {
    requirement: match.requirement,
    category: match.category,
    importance: match.importance,
    status: match.status,
    resumeEvidence: match.resumeEvidence,
    explanation: match.explanation,
    recommendation: match.recommendation,
  };
}

describe("model output carries its own id", () => {
  it("recommendations include a non-uuid id", () => {
    const parsed = analysisRecommendationSchema.parse(modelRecommendation);

    expect(parsed.id).toBe("rec-1");
    expect(parsed.id).not.toMatch(/^[0-9a-f-]{36}$/);
  });

  it("requirement matches include a non-uuid id", () => {
    const parsed = requirementMatchSchema.parse(modelMatch);

    expect(parsed.id).toBe("req-1");
  });
});

describe("persisted rows drop the model id", () => {
  it("a suggestion row carries no id", () => {
    expect(toSuggestionRow(modelRecommendation)).not.toHaveProperty("id");
  });

  it("a requirement match row carries no id", () => {
    expect(toMatchRow(modelMatch)).not.toHaveProperty("id");
  });

  it("spreading the model object would leak the id", () => {
    const spread = { analysisId: "x", ...modelRecommendation };

    expect(spread.id).toBe("rec-1");
  });

  it("a suggestion row keeps every column the table requires", () => {
    expect(Object.keys(toSuggestionRow(modelRecommendation)).sort()).toEqual([
      "action",
      "category",
      "problem",
      "reason",
      "severity",
    ]);
  });

  it("accepts any category string, since the column is text", () => {
    expect(
      analysisRecommendationSchema.parse({
        ...modelRecommendation,
        category: "CAREER_ALIGNMENT",
      }).category,
    ).toBe("CAREER_ALIGNMENT");
  });
});
