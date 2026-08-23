import { describe, expect, it } from "vitest";
import { z } from "zod";
import { normalizeJsonModelOutput } from "@/lib/ai/normalize";
import { applicationIntelligenceSchema } from "@/lib/ai/schemas/application-intelligence.schema";
import { MockApplicationIntelligenceProvider } from "@/lib/ai/providers/mock-application-intelligence-provider";

const schema = z.object({ value: z.string() });

async function mockAnalysis() {
  const result =
    await new MockApplicationIntelligenceProvider().analyzeApplication({
      resume: { pdfBytes: new Uint8Array(), filename: "resume.pdf", text: null },
      job: {
        title: "Site Manager",
        company: "Turner",
        location: null,
        workArrangement: "On site",
        employmentType: "Full time",
        deadline: null,
        source: null,
        sourceUrl: null,
        description: "Run the site.",
        requirements: null,
      },
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
    expect(
      normalizeJsonModelOutput('```\n{"value":"ok"}\n```', schema),
    ).toEqual({ value: "ok" });
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
        JSON.stringify({
          ...analysis,
          scoring: { ...(analysis.scoring as object), overallScore: 140 },
        }),
        applicationIntelligenceSchema,
      ),
    ).toThrow();
  });

  it("accepts a well-formed analysis", async () => {
    const analysis = await mockAnalysis();

    expect(
      normalizeJsonModelOutput(
        JSON.stringify(analysis),
        applicationIntelligenceSchema,
      ).scoring.overallScore,
    ).toBe(70);
  });
});
