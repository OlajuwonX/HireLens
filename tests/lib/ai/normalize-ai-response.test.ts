import { describe, expect, it } from "vitest";
import { z } from "zod";
import { normalizeJsonModelOutput } from "@/lib/ai/normalize-ai-response";
import { jobFitAnalysisSchema } from "@/lib/ai/schemas/job-fit-analysis.schema";
import { MockResumeAIProvider } from "@/lib/ai/providers/mock-resume-ai-provider";

const schema = z.object({ value: z.string() });

async function mockAnalysis() {
  const result = await new MockResumeAIProvider().analyzeResumeForJob({
    resume: { pdfBase64: "", filename: "resume.pdf", text: null },
    jobTitle: "Site Manager",
    company: "Turner",
    jobDescription: "Run the site.",
    requirements: null,
    priorCorrections: [],
  });

  return JSON.parse(String(result.rawResponse)) as Record<string, unknown>;
}

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

  it("rejects output that does not match the analysis schema", async () => {
    const analysis = await mockAnalysis();

    expect(() =>
      normalizeJsonModelOutput(
        JSON.stringify({ ...analysis, overallScore: 140 }),
        jobFitAnalysisSchema,
      ),
    ).toThrow();
  });

  it("accepts a well-formed analysis", async () => {
    const analysis = await mockAnalysis();

    expect(
      normalizeJsonModelOutput(JSON.stringify(analysis), jobFitAnalysisSchema)
        .overallScore,
    ).toBe(70);
  });
});
