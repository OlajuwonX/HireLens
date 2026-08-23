import { describe, expect, it } from "vitest";
import {
  auditResumeEvidence,
  compareOptimizationPasses,
  extractNumericEvidence,
  extractYearClaims,
} from "@/lib/ai/evidence-audit";

const source = [
  "Ada Okonkwo",
  "Senior Frontend Engineer with 5+ years building React applications.",
  "Improved rendering performance by 30% across the checkout journey.",
  "Cut defects by 40% by adding 20+ automated test suites.",
  "Held sub-2-second load times on a £1.2m programme.",
  "Deployed to Azure App Service with Express.js APIs.",
].join("\n");

describe("extractNumericEvidence", () => {
  it("keeps percentages, counts and scale markers", () => {
    const tokens = extractNumericEvidence(source);

    expect(tokens).toContain("30%");
    expect(tokens).toContain("40%");
    expect(tokens).toContain("20");
    expect(tokens).toContain("2");
    expect(tokens).toContain("1.2m");
  });

  it("treats an added plus sign as the same evidence", () => {
    expect(extractNumericEvidence("30%")).toEqual(extractNumericEvidence("30%+"));
  });

  it("does not read a following word as a unit", () => {
    expect(extractNumericEvidence("led 12 members")).toEqual(["12"]);
  });

  it("returns nothing for text without numbers", () => {
    expect(extractNumericEvidence("Managed stakeholder relationships")).toEqual(
      [],
    );
  });
});

describe("extractYearClaims", () => {
  it("reads the years a resume claims", () => {
    expect(extractYearClaims("5+ years of delivery")).toEqual([5]);
    expect(extractYearClaims("over 7 years in cost planning")).toEqual([7]);
    expect(extractYearClaims("8 or more years leading teams")).toEqual([8]);
  });

  it("ignores calendar years", () => {
    expect(extractYearClaims("Turner, 2019 - 2024")).toEqual([]);
  });
});

describe("TEST E: a verified metric survives optimization", () => {
  it("reports the metric as preserved when it is carried through", () => {
    const audit = auditResumeEvidence({
      sourceText: source,
      resumeText: "Improved rendering performance by 30% on checkout.",
    });

    expect(audit.preserved).toContain("30%");
    expect(audit.lost).not.toContain("30%");
  });

  it("reports the metric as lost when the bullet is genericized", () => {
    const audit = auditResumeEvidence({
      sourceText: source,
      resumeText: "Improved performance.",
    });

    expect(audit.lost).toContain("30%");
  });
});

describe("TEST A: years of experience are never inflated", () => {
  it("flags a resume that raises 5+ years to 7+ years", () => {
    const audit = auditResumeEvidence({
      sourceText: source,
      resumeText: "Senior engineer with 7+ years building React applications.",
    });

    expect(audit.inflatedYearClaims).toEqual([7]);
  });

  it("accepts a resume that keeps the supported 5+ years", () => {
    const audit = auditResumeEvidence({
      sourceText: source,
      resumeText: "Senior engineer with 5+ years building React applications.",
    });

    expect(audit.inflatedYearClaims).toEqual([]);
  });
});

describe("TEST J: unsupported numbers are detected", () => {
  it("names a metric the source resume never stated", () => {
    const audit = auditResumeEvidence({
      sourceText: source,
      resumeText: "Cut cloud spend by 55% across the estate.",
    });

    expect(audit.unsupported).toContain("55%");
  });

  it("treats a bracketed placeholder as no claim at all", () => {
    const audit = auditResumeEvidence({
      sourceText: source,
      resumeText: "Cut cloud spend by [verified percentage].",
    });

    expect(audit.unsupported).toEqual([]);
  });
});

describe("TEST F: evidence outside the job description still counts", () => {
  it("counts preserved evidence regardless of the posting", () => {
    const audit = auditResumeEvidence({
      sourceText: source,
      resumeText: "Held sub-2-second load times on a £1.2m programme.",
    });

    expect(audit.preserved).toEqual(expect.arrayContaining(["2", "1.2m"]));
  });
});

describe("TEST I: repeated re-analysis cannot degrade the resume", () => {
  const previous =
    "Improved rendering performance by 30%. Cut defects by 40% with 20+ suites. 5+ years.";

  it("keeps the previous version when a pass drops evidence", () => {
    const decision = compareOptimizationPasses({
      sourceText: source,
      previousResumeText: previous,
      nextResumeText: "Improved performance and reduced defects. 5+ years.",
    });

    expect(decision.keepPrevious).toBe(true);
    expect(decision.reason).toBe("LOST_EVIDENCE");
  });

  it("keeps the previous version when a pass swaps 5+ years for 7+ years", () => {
    const decision = compareOptimizationPasses({
      sourceText: source,
      previousResumeText: previous,
      nextResumeText: previous.replace("5+ years", "7+ years"),
    });

    expect(decision.keepPrevious).toBe(true);
  });

  it("keeps the previous version when a pass claims unsupported seniority in years", () => {
    const decision = compareOptimizationPasses({
      sourceText: source,
      previousResumeText: previous,
      nextResumeText: `${previous} Trusted with 7 years of architecture ownership.`,
    });

    expect(decision.keepPrevious).toBe(true);
    expect(decision.reason).toBe("INFLATED_EXPERIENCE");
  });

  it("keeps the previous version when a pass invents a number", () => {
    const decision = compareOptimizationPasses({
      sourceText: source,
      previousResumeText: previous,
      nextResumeText: `${previous} Cut cloud spend by 55%.`,
    });

    expect(decision.keepPrevious).toBe(true);
    expect(decision.reason).toBe("ADDED_UNSUPPORTED_NUMBERS");
  });

  it("accepts a pass that preserves the same evidence", () => {
    const decision = compareOptimizationPasses({
      sourceText: source,
      previousResumeText: previous,
      nextResumeText:
        "Improved checkout rendering performance by 30%. Cut defects by 40% through 20+ automated suites. 5+ years.",
    });

    expect(decision.keepPrevious).toBe(false);
    expect(decision.reason).toBe("NOT_WORSE");
  });

  it("accepts a pass that restores evidence an earlier pass lost", () => {
    const decision = compareOptimizationPasses({
      sourceText: source,
      previousResumeText: "Improved performance. 5+ years.",
      nextResumeText: previous,
    });

    expect(decision.keepPrevious).toBe(false);
    expect(decision.reason).toBe("NOT_WORSE");
  });
});

describe("the guard stays out of the way when it cannot judge", () => {
  it("accepts the new pass when there is no previous pass", () => {
    const decision = compareOptimizationPasses({
      sourceText: source,
      previousResumeText: null,
      nextResumeText: "Improved performance.",
    });

    expect(decision.keepPrevious).toBe(false);
    expect(decision.reason).toBe("NO_PREVIOUS_PASS");
  });

  it("accepts the new pass when the source text is unavailable", () => {
    const decision = compareOptimizationPasses({
      sourceText: null,
      previousResumeText: "Improved rendering performance by 30%.",
      nextResumeText: "Improved performance.",
    });

    expect(decision.keepPrevious).toBe(false);
    expect(decision.reason).toBe("NO_SOURCE_TEXT");
  });

  it("accepts the new pass when the source states no numbers at all", () => {
    const decision = compareOptimizationPasses({
      sourceText: "Managed stakeholder relationships across the practice.",
      previousResumeText: "Managed stakeholders.",
      nextResumeText: "Led stakeholder relationships across the practice.",
    });

    expect(decision.keepPrevious).toBe(false);
    expect(decision.reason).toBe("NO_SOURCE_TEXT");
  });
});
