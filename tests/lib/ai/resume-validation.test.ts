import { describe, expect, it } from "vitest";
import { improvedResumeToText } from "@/features/analyses/server/analysis.mapper";
import { validateOptimizedResume } from "@/lib/ai/resume-validation";
import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import type { TraceEntry } from "@/lib/ai/schemas/traceability.schema";
import { extractSourceEvidence } from "@/lib/ai/source-evidence";
import {
  faithfulResume,
  fullTrace,
  plant,
  sourceText,
} from "../../fixtures/rev/frontend-engineer";

const evidence = extractSourceEvidence(sourceText);
const allIds = evidence.map((item) => item.id);

function check(resume: ImprovedResume, traceability: TraceEntry[] = fullTrace(allIds)) {
  return validateOptimizedResume({
    sourceText,
    resume,
    resumeText: improvedResumeToText(resume),
    evidence,
    traceability,
    now: new Date("2026-11-12"),
  });
}

const codes = (resume: ImprovedResume) => check(resume).issues.map((issue) => issue.code);

describe("benchmark: a faithful optimization", () => {
  it("passes every check", () => {
    expect(check(faithfulResume()).issues).toEqual([]);
  });
});

describe("benchmark: planted mistakes are caught", () => {
  it.each([
    ["fabricated-technology", "UNSUPPORTED_TECHNOLOGY"],
    ["inflated-years", "INFLATED_YEARS"],
    ["changed-date", "CHANGED_DATE"],
    ["invented-metric", "UNSUPPORTED_NUMBER"],
    ["lost-metric", "LOST_NUMBER"],
    ["empty-summary", "MISSING_SECTION"],
  ] as const)("%s raises %s", (kind, code) => {
    expect(codes(plant(kind))).toContain(code);
  });

  it("names the fabricated technologies", () => {
    const issue = check(plant("fabricated-technology")).issues.find(
      (item) => item.code === "UNSUPPORTED_TECHNOLOGY",
    );

    expect(issue?.detail).toContain("GraphQL");
    expect(issue?.detail).toContain("AWS");
  });

  it("treats fabrication as an error and omissions as warnings", () => {
    expect(check(plant("invented-metric")).errorCount).toBeGreaterThan(0);
    expect(check(plant("lost-metric")).errorCount).toBe(0);
  });
});

describe("traceability coverage", () => {
  it("reports source statements with no recorded decision", () => {
    const result = check(faithfulResume(), fullTrace(allIds.slice(1)));
    const issue = result.issues.find((item) => item.code === "UNTRACED_SOURCE");

    expect(issue?.detail).toContain(allIds[0]);
    expect(result.errorCount).toBe(0);
  });

  it("requires a reason for every drop", () => {
    const trace = fullTrace(allIds).map((entry, index) =>
      index === 0 ? { ...entry, action: "DROP" as const, reason: " " } : entry,
    );

    expect(check(faithfulResume(), trace).issues.map((item) => item.code)).toContain(
      "DROP_WITHOUT_REASON",
    );
  });
});

describe("years of experience", () => {
  it("derives the ceiling from employment dates when no years are stated", () => {
    const resume = faithfulResume();
    resume.professionalSummary = "Frontend engineer with 7 years building React interfaces.";

    expect(codes(resume)).not.toContain("INFLATED_YEARS");
  });

  it("uses the years the resume states when it states them", () => {
    const resume = faithfulResume();
    resume.professionalSummary = "Frontend engineer with 6+ years of experience.";

    const result = validateOptimizedResume({
      sourceText: `${sourceText}
SUMMARY
5 years of frontend experience.`,
      resume,
      resumeText: improvedResumeToText(resume),
      evidence,
      traceability: fullTrace(allIds),
    });

    expect(result.issues.map((item) => item.code)).toContain("INFLATED_YEARS");
  });
});

describe("candidate corrections count as evidence", () => {
  it("accepts a skill the candidate confirmed", () => {
    const resume = plant("fabricated-technology");
    resume.skills[0].items = resume.skills[0].items.filter((item) => item !== "AWS");

    const result = validateOptimizedResume({
      sourceText,
      supplementText: "I used GraphQL at Brightpay for the merchant API.",
      resume,
      resumeText: improvedResumeToText(resume),
      evidence,
      traceability: fullTrace(allIds),
    });

    expect(result.issues.map((item) => item.code)).not.toContain("UNSUPPORTED_TECHNOLOGY");
  });
});
