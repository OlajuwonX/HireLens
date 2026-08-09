import { describe, expect, it } from "vitest";
import {
  evidenceCorrectionSchema,
  runJobFitSchema,
} from "@/features/analyses/schemas/analysis.schema";
import { jobFitAnalysisSchema } from "@/lib/ai/schemas/job-fit-analysis.schema";

const uuid = "8f1b1f4e-7c1a-4a5d-9a2e-2f9a5c1b3d77";
const otherUuid = "1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f";

describe("runJobFitSchema", () => {
  it("requires both a job and a resume version", () => {
    expect(
      runJobFitSchema.safeParse({ jobPublicId: uuid, versionPublicId: uuid })
        .success,
    ).toBe(true);
    expect(
      runJobFitSchema.safeParse({ jobPublicId: uuid, versionPublicId: "" })
        .success,
    ).toBe(false);
  });
});

describe("evidenceCorrectionSchema", () => {
  const base = { matchId: uuid, analysisPublicId: otherUuid };

  it("accepts a correction that only marks the conclusion wrong", () => {
    const result = evidenceCorrectionSchema.safeParse({
      ...base,
      markedIncorrect: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.evidence).toBeUndefined();
  });

  it("defaults markedIncorrect to false when the checkbox is absent", () => {
    expect(evidenceCorrectionSchema.parse(base).markedIncorrect).toBe(false);
  });

  it("treats blank evidence and notes as absent", () => {
    const result = evidenceCorrectionSchema.parse({
      ...base,
      evidence: "   ",
      notes: "",
    });

    expect(result.evidence).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });

  it("rejects a non-uuid match id", () => {
    expect(
      evidenceCorrectionSchema.safeParse({ ...base, matchId: "1" }).success,
    ).toBe(false);
  });
});

describe("jobFitAnalysisSchema", () => {
  const valid = {
    overallScore: 71,
    atsScore: 66,
    jobFitScore: 74,
    scoreExplanations: {
      overall: {
        score: 71,
        explanation: "Strong delivery evidence with a certification gap.",
      },
      ats: {
        score: 66,
        explanation: "Some required terms are missing or weakly represented.",
      },
      jobFit: {
        score: 74,
        explanation: "The resume maps to most core requirements.",
      },
    },
    summary: "Strong on delivery, light on certification.",
    summaryRecommendation: "Open with the site-management evidence.",
    missingRequirements: ["NEBOSH certificate"],
    keywordGroups: {
      skills: [],
      tools: [],
      responsibilities: [],
      industryLanguage: [],
      certifications: [
        {
          keyword: "NEBOSH",
          status: "MISSING",
          recommendation: "Add only if held.",
        },
      ],
      experienceTerms: [],
    },
    bulletIssues: [
      {
        original: "Managed the site.",
        issue: "Too vague.",
        recommendation: "Add scope and verified outcome.",
      },
    ],
    requirementMatches: [
      {
        id: "r1",
        requirement: "Five years of site management",
        category: "EXPERIENCE",
        importance: "REQUIRED",
        status: "STRONG",
        resumeEvidence: "Ran the Turner site 2019-2024.",
        explanation: "Directly stated on the resume.",
        recommendation: null,
      },
    ],
    recommendations: [
      {
        id: "rec1",
        category: "Content",
        severity: "HIGH",
        problem: "No certification listed.",
        reason: "The posting names it.",
        action: "Add it if held.",
      },
    ],
  };

  it("accepts a well-formed job-fit result", () => {
    expect(jobFitAnalysisSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an unknown requirement status", () => {
    const result = jobFitAnalysisSchema.safeParse({
      ...valid,
      requirementMatches: [
        { ...valid.requirementMatches[0], status: "PROBABLY" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown importance", () => {
    const result = jobFitAnalysisSchema.safeParse({
      ...valid,
      requirementMatches: [
        { ...valid.requirementMatches[0], importance: "NICE_TO_HAVE" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("allows null evidence for a missing requirement", () => {
    const result = jobFitAnalysisSchema.safeParse({
      ...valid,
      requirementMatches: [
        {
          ...valid.requirementMatches[0],
          status: "MISSING",
          resumeEvidence: null,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a score outside 0-100", () => {
    expect(
      jobFitAnalysisSchema.safeParse({ ...valid, jobFitScore: 140 }).success,
    ).toBe(false);
  });
});
