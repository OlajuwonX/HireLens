import { describe, expect, it } from "vitest";
import { z } from "zod";
import { normalizeJsonModelOutput } from "./normalize-ai-response";
import { generalResumeAnalysisSchema } from "./schemas/resume-analysis.schema";

const schema = z.object({ value: z.string() });

const validAnalysis = {
  overallScore: 72,
  atsScore: 68,
  summary: "A solid resume with room to quantify impact.",
  strengths: ["Clear structure"],
  weaknesses: ["Few measurable outcomes"],
  recommendations: [
    {
      id: "rec-1",
      category: "Content",
      severity: "HIGH",
      problem: "Bullets describe duties rather than outcomes.",
      reason: "Outcome-led bullets rank better with reviewers.",
      action: "Rewrite each bullet to lead with a result.",
    },
  ],
};

describe("normalizeJsonModelOutput", () => {
  it("parses a plain JSON string", () => {
    expect(normalizeJsonModelOutput('{"value":"ok"}', schema)).toEqual({
      value: "ok",
    });
  });

  it("strips a json code fence", () => {
    expect(
      normalizeJsonModelOutput('```json\n{"value":"ok"}\n```', schema),
    ).toEqual({ value: "ok" });
  });

  it("strips a bare code fence", () => {
    expect(normalizeJsonModelOutput('```\n{"value":"ok"}\n```', schema)).toEqual(
      { value: "ok" },
    );
  });

  it("reads content from a message wrapper", () => {
    expect(
      normalizeJsonModelOutput(
        { message: { content: '{"value":"ok"}' } },
        schema,
      ),
    ).toEqual({ value: "ok" });
  });

  it("throws when there is no text content", () => {
    expect(() => normalizeJsonModelOutput({ nope: true }, schema)).toThrow(
      /did not contain text content/,
    );
  });

  it("throws on malformed JSON rather than returning a partial object", () => {
    expect(() => normalizeJsonModelOutput('{"value":', schema)).toThrow();
  });

  it("rejects output that does not match the analysis schema", () => {
    expect(() =>
      normalizeJsonModelOutput(
        JSON.stringify({ ...validAnalysis, overallScore: 140 }),
        generalResumeAnalysisSchema,
      ),
    ).toThrow();
  });

  it("accepts a well-formed analysis", () => {
    expect(
      normalizeJsonModelOutput(
        JSON.stringify(validAnalysis),
        generalResumeAnalysisSchema,
      ).overallScore,
    ).toBe(72);
  });
});
