import { describe, expect, it } from "vitest";
import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";
import { generateDocumentSchema } from "@/features/documents/schemas/document.schema";
import { evidenceCorrectionSchema } from "@/features/analyses/schemas/analysis.schema";

describe("blankToUndefined", () => {
  it("maps null to undefined, which is what an absent FormData field is", () => {
    expect(blankToUndefined(null)).toBeUndefined();
  });

  it("maps undefined to undefined", () => {
    expect(blankToUndefined(undefined)).toBeUndefined();
  });

  it("maps an empty and whitespace-only string to undefined", () => {
    expect(blankToUndefined("")).toBeUndefined();
    expect(blankToUndefined("   ")).toBeUndefined();
  });

  it("passes real values through untouched", () => {
    expect(blankToUndefined(" hello ")).toBe(" hello ");
    expect(blankToUndefined(0)).toBe(0);
    expect(blankToUndefined(false)).toBe(false);
  });

  it("leaves an optional field valid when the input is null", () => {
    const schema = z.object({
      note: z.preprocess(blankToUndefined, z.string().optional()),
    });

    expect(schema.safeParse({ note: null }).success).toBe(true);
  });
});

describe("form schemas tolerate absent optional fields", () => {
  const jobPublicId = "b0f1c1d2-1111-4111-8111-111111111111";

  it("generates a document when the form omits notes and resume version", () => {
    const parsed = generateDocumentSchema.safeParse({
      type: "COVER_LETTER",
      jobPublicId,
      resumeVersionPublicId: null,
      applicationPublicId: null,
      notes: null,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.notes).toBeUndefined();
      expect(parsed.data.resumeVersionPublicId).toBeUndefined();
    }
  });

  it("still rejects a missing job", () => {
    const parsed = generateDocumentSchema.safeParse({
      type: "COVER_LETTER",
      jobPublicId: "",
      resumeVersionPublicId: null,
      applicationPublicId: null,
      notes: null,
    });

    expect(parsed.success).toBe(false);
  });

  it("saves an evidence correction when the form omits evidence and notes", () => {
    const parsed = evidenceCorrectionSchema.safeParse({
      analysisPublicId: jobPublicId,
      requirementKey: "relevant-experience",
      markedIncorrect: true,
      evidence: null,
      notes: null,
    });

    expect(parsed.success).toBe(true);
  });
});
