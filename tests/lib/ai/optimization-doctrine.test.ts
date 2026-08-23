import { describe, expect, it } from "vitest";
import {
  BASE_SYSTEM_PROMPT,
  IMPROVED_RESUME_PROMPT,
  KEYWORD_ANALYSIS_PROMPT,
  OPTIMIZATION_PLAN_PROMPT,
  PROFESSIONAL_SUMMARY_PROMPT,
  REFINEMENT_PASS_PROMPT,
  SCORING_PROMPT,
  createApplicationIntelligencePrompt,
  formatPreviousOptimization,
} from "@/lib/ai/prompts";

describe("the optimization hierarchy is stated before anything is rewritten", () => {
  it("ranks truthfulness and evidence above ATS coverage", () => {
    expect(BASE_SYSTEM_PROMPT).toContain("1. Truthfulness");
    expect(BASE_SYSTEM_PROMPT).toContain("2. Evidence preservation");
    expect(BASE_SYSTEM_PROMPT).toContain("5. ATS keyword coverage");
    expect(BASE_SYSTEM_PROMPT).toContain(
      "ATS keyword coverage never outranks truthful evidence preservation",
    );
  });

  it("refuses to be a job-description paraphraser", () => {
    expect(BASE_SYSTEM_PROMPT).toContain("not a job-description paraphraser");
  });

  it("separates the four evidence cases", () => {
    for (const label of [
      "EXACT MATCH",
      "RELATED or TRANSFERABLE",
      "WORDING GAP",
      "QUALIFICATION GAP",
    ]) {
      expect(BASE_SYSTEM_PROMPT).toContain(label);
    }
  });
});

describe("the improved resume is driven by the evidence analysis", () => {
  it("names the reasoning chain the optimizer must follow", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "REQUIREMENT -> CANDIDATE EVIDENCE -> EVIDENCE STRENGTH -> RELEVANCE -> OPTIMIZATION DECISION",
    );
  });

  it("reads from the requirement and keyword analysis", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain("requirementMatches");
    expect(IMPROVED_RESUME_PROMPT).toContain("keywordAnalysis");
  });

  it("states the preservation doctrine", () => {
    for (const item of [
      "verified metrics and quantified achievements",
      "employer names, job titles and dates",
      "education, certifications and licences",
      "leadership and ownership evidence",
    ]) {
      expect(IMPROVED_RESUME_PROMPT).toContain(item);
    }
  });

  it("forbids dropping a bullet just because the posting is silent about it", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "A bullet must not disappear because the job description does not mention its exact topic",
    );
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "Never silently delete meaningful evidence",
    );
  });

  it("TEST E: keeps quantified achievements out of generic restatement", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain(
      `"Improved rendering performance by 30%" must never become "Improved performance."`,
    );
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "Never invent, round, inflate or alter a number",
    );
  });

  it("TEST B: keeps Azure and refuses to claim AWS", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "Posting asks for AWS, resume proves Azure: keep Azure, treat cloud experience as transferable, never claim AWS",
    );
  });

  it("TEST C: keeps Express.js without claiming Node.js", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "keep Express.js and leave Node.js as a gap unless the resume independently proves Node.js",
    );
  });

  it("TEST D: refuses to add Docker the resume never evidences", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "do not add Docker. It is a qualification gap",
    );
  });

  it("TEST A: holds years of experience at what the resume supports", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "If the posting asks for 7+ years and the resume supports 5+, the improved resume still says 5+",
    );
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "Never raise the years the resume supports",
    );
  });

  it("treats seniority as evidence rather than aspiration", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "Never promote the candidate's level to match the posting",
    );
  });

  it("TEST H: carries certifications and other sections the resume states", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "Return every certification or licence the resume states",
    );
    expect(IMPROVED_RESUME_PROMPT).toContain("additionalSections");
    expect(IMPROVED_RESUME_PROMPT).toContain(
      "Never create a section the resume does not support",
    );
  });

  it("stays profession-agnostic", () => {
    expect(IMPROVED_RESUME_PROMPT).toContain("Do not assume software engineering");
    expect(BASE_SYSTEM_PROMPT).toContain("Do not assume a technology career");
  });
});

describe("TEST G: an already strong resume is optimized surgically", () => {
  it("ties rewrite intensity to measured alignment", () => {
    for (const level of ["HIGH", "MEDIUM", "LOW"]) {
      expect(OPTIMIZATION_PLAN_PROMPT).toContain(level);
    }

    for (const intensity of ["SURGICAL", "TARGETED", "SUBSTANTIAL"]) {
      expect(OPTIMIZATION_PLAN_PROMPT).toContain(intensity);
    }
  });

  it("forbids rewriting for the sake of rewriting", () => {
    expect(OPTIMIZATION_PLAN_PROMPT).toContain(
      "must not be rewritten aggressively merely because rewriting is possible",
    );
  });

  it("requires a retention ledger for every removal", () => {
    for (const disposition of ["KEEP", "REFINE", "MERGE", "DROP"]) {
      expect(OPTIMIZATION_PLAN_PROMPT).toContain(disposition);
    }

    expect(OPTIMIZATION_PLAN_PROMPT).toContain(
      "Removing evidence without recording it here is an error",
    );
  });
});

describe("keyword analysis asks whether evidence can be exposed, not matched", () => {
  it("states the question it is answering", () => {
    expect(KEYWORD_ANALYSIS_PROMPT).toContain(
      "Can we legitimately expose this requirement better using evidence the resume already proves?",
    );
    expect(KEYWORD_ANALYSIS_PROMPT).toContain(
      `"Is this exact word in the resume?"`,
    );
  });

  it("keeps the existing groups and gap types", () => {
    for (const concept of [
      "present",
      "transferable",
      "missing",
      "avoidForcing",
      "gapType",
      "existingEvidence",
      "QUALIFICATION_GAP",
      "WORDING_ONLY",
    ]) {
      expect(KEYWORD_ANALYSIS_PROMPT).toContain(concept);
    }
  });

  it("lets a wording gap be surfaced but never a qualification gap", () => {
    expect(KEYWORD_ANALYSIS_PROMPT).toContain(
      "A WORDING_ONLY gap may be surfaced in the improved resume",
    );
    expect(KEYWORD_ANALYSIS_PROMPT).toContain(
      "A QUALIFICATION_GAP may never be surfaced in the improved resume",
    );
  });

  it("is not keyword stuffing", () => {
    expect(KEYWORD_ANALYSIS_PROMPT).toContain("not keyword stuffing");
  });
});

describe("the professional summary is built from real evidence", () => {
  it("asks the five questions a summary must answer", () => {
    for (const question of [
      "Who is this candidate?",
      "What do they actually do?",
      "What are they strong at?",
      "What level are they operating at?",
    ]) {
      expect(PROFESSIONAL_SUMMARY_PROMPT).toContain(question);
    }
  });

  it("bans the usual filler", () => {
    for (const phrase of [
      "results-driven professional",
      "passionate team player",
      "proven track record",
      "highly motivated",
    ]) {
      expect(PROFESSIONAL_SUMMARY_PROMPT).toContain(phrase);
    }
  });

  it("does not assume technology terminology", () => {
    expect(PROFESSIONAL_SUMMARY_PROMPT).toContain(
      "Do not assume technology terminology",
    );
  });
});

describe("scoring follows the evidence", () => {
  it("gives transferable evidence partial credit only", () => {
    expect(SCORING_PROMPT).toContain(
      "A related but different technology earns partial credit, never full credit",
    );
    expect(SCORING_PROMPT).toContain(
      "does not receive full credit against a seven-year requirement",
    );
    expect(SCORING_PROMPT).toContain(
      "Missing hard requirements must reduce the score",
    );
  });
});

describe("TEST I: the re-analyze pass refines instead of rewriting", () => {
  const previous = {
    improvedResume: "Improved rendering performance by 30%.",
    professionalSummary: "Frontend engineer with 5+ years.",
    unresolvedRequirements: ["Seven years of React"],
    unresolvedKeywords: ["Accessibility"],
  };

  it("is absent from a first pass", () => {
    const prompt = createApplicationIntelligencePrompt();

    expect(prompt).not.toContain("REFINEMENT PASS:");
  });

  it("is added when a previous optimization exists", () => {
    const prompt = createApplicationIntelligencePrompt([], {
      refinement: true,
    });

    expect(prompt).toContain("REFINEMENT PASS:");
  });

  it("forbids progressive erosion across passes", () => {
    expect(REFINEMENT_PASS_PROMPT).toContain(
      "Every fact verified in an earlier pass must survive this one",
    );
    expect(REFINEMENT_PASS_PROMPT).toContain(
      "Repeated passes must never progressively erode the resume",
    );
    expect(REFINEMENT_PASS_PROMPT).toContain(
      "Change a section only when the change is a demonstrable improvement",
    );
  });

  it("carries the previous resume and its open gaps into the prompt", () => {
    const block = formatPreviousOptimization(previous);

    expect(block).toContain("<previous_optimized_resume>");
    expect(block).toContain("Improved rendering performance by 30%.");
    expect(block).toContain("Seven years of React");
    expect(block).toContain("Accessibility");
    expect(block?.endsWith("</previous_optimized_resume>")).toBe(true);
  });

  it("returns nothing when there is no previous pass to refine", () => {
    expect(formatPreviousOptimization(null)).toBeNull();
    expect(
      formatPreviousOptimization({ ...previous, improvedResume: "  " }),
    ).toBeNull();
  });
});
