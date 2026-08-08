import { describe, expect, it } from "vitest";
import {
  pruneToSupportedKeywords,
  toGeminiResponseSchema,
} from "./gemini-json-schema";
import { jobFitAnalysisSchema } from "./schemas/job-fit-analysis.schema";
import { generalResumeAnalysisSchema } from "./schemas/resume-analysis.schema";

function collectKeys(value: unknown, found = new Set<string>()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, found));
    return found;
  }

  if (value === null || typeof value !== "object") {
    return found;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    found.add(key);
    collectKeys(child, found);
  }

  return found;
}

describe("pruneToSupportedKeywords", () => {
  it("drops keywords Gemini does not accept", () => {
    expect(
      pruneToSupportedKeywords({
        $schema: "http://json-schema.org/draft-07/schema#",
        type: "string",
        minLength: 1,
        maxLength: 10,
      }),
    ).toEqual({ type: "string" });
  });

  it("keeps numeric bounds, which are supported", () => {
    expect(
      pruneToSupportedKeywords({ type: "integer", minimum: 0, maximum: 100 }),
    ).toEqual({ type: "integer", minimum: 0, maximum: 100 });
  });

  it("does not treat property names as keywords", () => {
    const pruned = pruneToSupportedKeywords({
      type: "object",
      properties: {
        minLength: { type: "string", minLength: 3 },
        title: { type: "string" },
      },
    }) as { properties: Record<string, unknown> };

    expect(Object.keys(pruned.properties).sort()).toEqual([
      "minLength",
      "title",
    ]);
    expect(pruned.properties.minLength).toEqual({ type: "string" });
  });

  it("prunes through arrays and nested items", () => {
    expect(
      pruneToSupportedKeywords({
        type: "array",
        items: { type: "string", minLength: 1 },
      }),
    ).toEqual({ type: "array", items: { type: "string" } });
  });
});

describe("toGeminiResponseSchema", () => {
  it("emits only supported keywords for the general analysis schema", () => {
    const keys = collectKeys(toGeminiResponseSchema(generalResumeAnalysisSchema));

    expect(keys.has("$schema")).toBe(false);
    expect(keys.has("minLength")).toBe(false);
  });

  it("emits only supported keywords for the job fit schema", () => {
    const keys = collectKeys(toGeminiResponseSchema(jobFitAnalysisSchema));

    expect(keys.has("$schema")).toBe(false);
    expect(keys.has("minLength")).toBe(false);
  });

  it("preserves the analysis shape the service depends on", () => {
    const schema = toGeminiResponseSchema(generalResumeAnalysisSchema) as {
      type: string;
      required: string[];
      properties: Record<string, unknown>;
    };

    expect(schema.type).toBe("object");
    expect(schema.required).toEqual(
      expect.arrayContaining([
        "overallScore",
        "atsScore",
        "summary",
        "recommendations",
      ]),
    );
    expect(schema.properties.overallScore).toEqual({
      type: "integer",
      minimum: 0,
      maximum: 100,
    });
  });

  it("preserves enum values on recommendation severity", () => {
    const schema = toGeminiResponseSchema(generalResumeAnalysisSchema) as {
      properties: {
        recommendations: {
          items: { properties: { severity: { enum: string[] } } };
        };
      };
    };

    expect(schema.properties.recommendations.items.properties.severity.enum).toEqual(
      ["LOW", "MEDIUM", "HIGH"],
    );
  });
});
