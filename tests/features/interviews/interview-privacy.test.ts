import { describe, expect, it } from "vitest";
import {
  assertGeneralizedInterviewPool,
  containsIdentifiableContent,
  generatedInterviewPoolSchema,
  REQUIRED_DIFFICULTY_DISTRIBUTION,
  scrubIdentifiableContent,
  type GeneratedDifficulty,
} from "@/lib/ai/schemas/interview-pool.schema";
import { emptyOptimizationPlan } from "@/lib/ai/schemas/optimization-plan.schema";
import type { StoredApplicationIntelligence } from "@/lib/ai/schemas/application-intelligence.schema";
import { buildInterviewProfile } from "@/features/interviews/interview-profile";

function question(n: number, difficulty: GeneratedDifficulty) {
  return {
    question: `Generalized interview question number ${n} about the role in depth`,
    options: [`A${n}`, `B${n}`, `C${n}`, `D${n}`],
    correctOption: n % 4,
    explanation: `Explanation ${n} that stays about the profession, not a person.`,
    difficulty,
    topic: `topic-${n}`,
  };
}

function validPool() {
  const questions: ReturnType<typeof question>[] = [];
  let n = 1;

  for (const difficulty of Object.keys(
    REQUIRED_DIFFICULTY_DISTRIBUTION,
  ) as GeneratedDifficulty[]) {
    for (let i = 0; i < REQUIRED_DIFFICULTY_DISTRIBUTION[difficulty]; i++) {
      questions.push(question(n++, difficulty));
    }
  }

  return generatedInterviewPoolSchema.parse({ questions });
}

describe("containsIdentifiableContent", () => {
  it("flags contact details and profile links", () => {
    expect(containsIdentifiableContent("reach me at jane.doe@example.com")).toBe(
      true,
    );
    expect(containsIdentifiableContent("see https://github.com/janedoe")).toBe(
      true,
    );
    expect(containsIdentifiableContent("linkedin.com/in/jane-doe")).toBe(true);
    expect(containsIdentifiableContent("call +1 (555) 123-4567")).toBe(true);
    expect(containsIdentifiableContent("ping @janedoe about it")).toBe(true);
  });

  it("leaves ordinary professional wording alone", () => {
    expect(
      containsIdentifiableContent(
        "Design a REST API that scales to 100000 requests per minute",
      ),
    ).toBe(false);
    expect(
      containsIdentifiableContent("Worked across 2019 to 2024 on delivery"),
    ).toBe(false);
  });
});

describe("scrubIdentifiableContent", () => {
  it("removes the identifier and keeps the rest", () => {
    expect(
      scrubIdentifiableContent(
        "Owned the billing service, contact jane@corp.com for handover",
      ),
    ).toBe("Owned the billing service, contact for handover");
  });
});

describe("assertGeneralizedInterviewPool", () => {
  it("passes a pool with no identifiable content", () => {
    expect(() => assertGeneralizedInterviewPool(validPool())).not.toThrow();
  });

  it("rejects a pool with an email in a question", () => {
    const pool = validPool();
    pool.questions[3].question =
      "According to the note from j.smith@acme.io, which approach is safest?";

    expect(() => assertGeneralizedInterviewPool(pool)).toThrow(/identifiable/);
  });

  it("rejects a pool with a phone number in an explanation", () => {
    const pool = validPool();
    pool.questions[10].explanation = "The on-call line is 555-123-4567.";

    expect(() => assertGeneralizedInterviewPool(pool)).toThrow(/identifiable/);
  });

  it("rejects a pool with a link in an option", () => {
    const pool = validPool();
    pool.questions[20].options[1] = "Deploy from https://internal.example.com";

    expect(() => assertGeneralizedInterviewPool(pool)).toThrow(/identifiable/);
  });
});

function analysisWithResponsibilities(
  responsibilities: string[],
): StoredApplicationIntelligence {
  return {
    scoring: {},
    recommendations: [],
    keywordAnalysis: {
      present: ["React", "TypeScript"],
      transferable: [],
      missing: [],
      avoidForcing: [],
    },
    requirementMatches: responsibilities.map((requirement, index) => ({
      key: `r-${index}`,
      requirement,
      category: "RESPONSIBILITY" as const,
      importance: "REQUIRED" as const,
      status: "STRONG" as const,
      resumeEvidence: null,
      explanation: "x",
      recommendation: null,
    })),
    optimizationPlan: emptyOptimizationPlan,
    improvedResume: {
      header: {
        name: "Test User",
        headline: "Frontend Engineer",
        location: null,
        email: null,
        phone: null,
        links: [],
      },
      professionalSummary: "",
      skills: [{ category: "Frontend", items: ["React", "TypeScript"] }],
      experience: [],
      projects: [],
      education: [],
      certifications: [],
      additionalSections: [],
    },
    bulletRewrites: [],
    professionalSummary: "",
    coverLetter: "",
    applicationEmail: { subject: "", body: "" },
    followUpMessage: "",
  } as StoredApplicationIntelligence;
}

describe("buildInterviewProfile privacy scrub", () => {
  it("scrubs identifiers out of responsibilities and drops PII-only entries", () => {
    const profile = buildInterviewProfile({
      jobTitle: "Frontend Engineer",
      jobDescription:
        "Own the design system and mentor engineers across the web platform team.",
      jobRequirements: "React, TypeScript, accessibility, testing",
      resumeText: null,
      analysis: analysisWithResponsibilities([
        "Own the checkout flow, escalate to jane@corp.com when blocked",
        "https://confluence.corp.com/runbook",
        "Lead accessibility reviews across the platform",
      ]),
    });

    expect(profile.responsibilities).toEqual([
      "Own the checkout flow, escalate to when blocked",
      "Lead accessibility reviews across the platform",
    ]);
    for (const entry of profile.responsibilities) {
      expect(containsIdentifiableContent(entry)).toBe(false);
    }
  });
});
