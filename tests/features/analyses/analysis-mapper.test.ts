import {
  AI_VIEWS,
  improvedResumeToText,
  mergeCorrections,
  readStoredIntelligence,
  viewIsPopulated,
  viewToPlainText,
} from "@/features/analyses/server/analysis.mapper";
import { MockApplicationIntelligenceProvider } from "@/lib/ai/providers/mock-application-intelligence-provider";
import {
  applicationIntelligenceSchema,
  storedApplicationIntelligenceSchema,
} from "@/lib/ai/schemas/application-intelligence.schema";
import type { UserEvidenceCorrection } from "@/lib/db/schema";
import { describe, expect, it } from "vitest";

async function mockResult() {
  const provider = new MockApplicationIntelligenceProvider();
  const output = await provider.analyzeApplication({
    resume: { pdfBase64: "", filename: "resume.pdf", text: null },
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

  return applicationIntelligenceSchema.parse(
    JSON.parse(String(output.rawResponse)),
  );
}

describe("the mock provider satisfies the single schema", () => {
  it("parses without throwing", async () => {
    await expect(mockResult()).resolves.toBeDefined();
  });
});

describe("readStoredIntelligence", () => {
  it("returns null for an analysis that has not succeeded", () => {
    expect(
      readStoredIntelligence({ status: "PENDING", resultJson: {} }),
    ).toBeNull();
  });

  it("returns null when there is no stored result", () => {
    expect(
      readStoredIntelligence({ status: "SUCCEEDED", resultJson: null }),
    ).toBeNull();
  });

  it("reads a succeeded analysis", async () => {
    const result = await mockResult();

    expect(
      readStoredIntelligence({ status: "SUCCEEDED", resultJson: result }),
    ).not.toBeNull();
  });

  it("still reads a result that is missing newer sections", () => {
    const partial = readStoredIntelligence({
      status: "SUCCEEDED",
      resultJson: { coverLetter: "Only this survived." },
    });

    expect(partial?.coverLetter).toBe("Only this survived.");
    expect(partial?.recommendations).toEqual([]);
    expect(partial?.improvedResume.experience).toEqual([]);
  });
});

describe("viewToPlainText", () => {
  it("produces copyable text for every view", async () => {
    const result = storedApplicationIntelligenceSchema.parse(
      await mockResult(),
    );

    for (const view of AI_VIEWS) {
      expect(viewToPlainText(result, view).length).toBeGreaterThan(0);
    }
  });

  it("puts the subject line above the email body", async () => {
    const result = storedApplicationIntelligenceSchema.parse(
      await mockResult(),
    );
    const text = viewToPlainText(result, "APPLICATION_EMAIL");

    expect(text.startsWith("Subject: ")).toBe(true);
    expect(text).toContain(result.applicationEmail.body);
  });

  it("keeps the before and after of a bullet rewrite", async () => {
    const result = storedApplicationIntelligenceSchema.parse(
      await mockResult(),
    );
    const text = viewToPlainText(result, "BULLET_REWRITE");

    expect(text).toContain("Before: Managed projects.");
    expect(text).toContain("After: ");
  });
});

describe("viewIsPopulated", () => {
  it("is true for every view the mock returns", async () => {
    const result = storedApplicationIntelligenceSchema.parse(
      await mockResult(),
    );

    for (const view of AI_VIEWS) {
      expect(viewIsPopulated(result, view)).toBe(true);
    }
  });

  it("is false when a section came back empty", async () => {
    const result = storedApplicationIntelligenceSchema.parse({
      ...(await mockResult()),
      coverLetter: "",
      bulletRewrites: [],
    });

    expect(viewIsPopulated(result, "COVER_LETTER")).toBe(false);
    expect(viewIsPopulated(result, "BULLET_REWRITE")).toBe(false);
  });
});

describe("improvedResumeToText", () => {
  it("leads with the name and headline", async () => {
    const result = await mockResult();
    const lines = improvedResumeToText(result.improvedResume).split("\n");

    expect(lines[0]).toBe(result.improvedResume.header.name);
    expect(lines[1]).toBe(result.improvedResume.header.headline);
  });

  it("preserves placeholders rather than inventing numbers", async () => {
    const result = await mockResult();

    expect(improvedResumeToText(result.improvedResume)).toContain(
      "[verified outcome]",
    );
  });

  it("omits sections the resume does not have", async () => {
    const result = await mockResult();
    const text = improvedResumeToText(result.improvedResume);

    expect(text).not.toContain("PROJECTS");
    expect(text).not.toContain("EDUCATION");
  });
});

describe("mergeCorrections", () => {
  const correction = {
    requirementKey: "formal-certification",
    markedIncorrect: true,
    evidence: "I hold it, page two.",
    notes: null,
  } as UserEvidenceCorrection;

  it("attaches a correction to its requirement by key", async () => {
    const result = storedApplicationIntelligenceSchema.parse(
      await mockResult(),
    );
    const rows = mergeCorrections(result, [correction]);
    const corrected = rows.find(
      (row) => row.match.key === "formal-certification",
    );

    expect(corrected?.correction?.markedIncorrect).toBe(true);
  });

  it("leaves uncorrected requirements alone", async () => {
    const result = storedApplicationIntelligenceSchema.parse(
      await mockResult(),
    );
    const rows = mergeCorrections(result, [correction]);

    expect(
      rows.find((row) => row.match.key === "relevant-experience")?.correction,
    ).toBeNull();
  });

  it("returns one row per requirement", async () => {
    const result = storedApplicationIntelligenceSchema.parse(
      await mockResult(),
    );

    expect(mergeCorrections(result, []).length).toBe(
      result.requirementMatches.length,
    );
  });
});
