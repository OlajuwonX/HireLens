import { describe, expect, it } from "vitest";
import type { StoredApplicationIntelligence } from "@/lib/ai/schemas/application-intelligence.schema";
import { emptyOptimizationPlan } from "@/lib/ai/schemas/optimization-plan.schema";
import {
  buildInterviewProfile,
  interviewFingerprint,
  type InterviewProfileInput,
} from "@/features/interviews/interview-profile";
import {
  normalizeSkill,
  resolveRoleFamily,
} from "@/features/interviews/role-taxonomy";

function analysisWith(
  overrides: Partial<StoredApplicationIntelligence> = {},
): StoredApplicationIntelligence {
  return {
    scoring: {},
    recommendations: [],
    keywordAnalysis: {
      present: [],
      transferable: [],
      missing: [],
      avoidForcing: [],
    },
    requirementMatches: [],
    optimizationPlan: emptyOptimizationPlan,
    improvedResume: {
      header: {
        name: "Test User",
        headline: "",
        location: null,
        email: null,
        phone: null,
        links: [],
      },
      professionalSummary: "",
      skills: [],
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
    ...overrides,
  } as StoredApplicationIntelligence;
}

const FRONTEND_SKILLS = [
  "React",
  "TypeScript",
  "Next.js",
  "Redux",
  "Tailwind CSS",
  "CSS",
  "Jest",
];

function frontendInput(
  title: string,
  extra: Partial<InterviewProfileInput> = {},
): InterviewProfileInput {
  return {
    jobTitle: title,
    jobDescription:
      "Build accessible React interfaces with TypeScript and Next.js for a design-system-driven product.",
    jobRequirements: "React, TypeScript, Next.js, testing, accessibility",
    resumeText: null,
    analysis: analysisWith({
      keywordAnalysis: {
        present: FRONTEND_SKILLS,
        transferable: [],
        missing: [],
        avoidForcing: [],
      },
      improvedResume: {
        ...analysisWith().improvedResume,
        header: {
          ...analysisWith().improvedResume.header,
          headline: title,
        },
        skills: [{ category: "Frontend", items: FRONTEND_SKILLS }],
        experience: [],
      },
    }),
    ...extra,
  };
}

describe("resolveRoleFamily", () => {
  it("maps related software titles with a frontend skill lean to frontend-engineering", () => {
    for (const title of [
      "Software Engineer",
      "Software Developer",
      "React Developer",
      "Frontend Software Engineer",
      "Senior Front End Developer",
    ]) {
      const resolution = resolveRoleFamily({
        title,
        skills: FRONTEND_SKILLS,
        jobText: "react typescript nextjs accessibility design system",
      });

      expect(resolution.roleFamily).toBe("frontend-engineering");
    }
  });

  it("maps a backend skill lean to backend-engineering", () => {
    const resolution = resolveRoleFamily({
      title: "Software Engineer",
      skills: ["Go", "PostgreSQL", "Kafka", "gRPC", "Microservices", "Redis"],
      jobText: "design resilient services and apis in go",
    });

    expect(resolution.roleFamily).toBe("backend-engineering");
  });

  it("keeps unrelated professions in their own domains", () => {
    const nurse = resolveRoleFamily({
      title: "Registered Nurse",
      skills: ["Patient care", "Medication administration", "Triage"],
    });
    const surveyor = resolveRoleFamily({
      title: "Quantity Surveyor",
      skills: ["Cost planning", "Procurement", "JCT", "Valuations"],
    });
    const lawyer = resolveRoleFamily({
      title: "Corporate Solicitor",
      skills: ["Legal research", "Drafting", "Due diligence"],
    });

    expect(nurse.roleFamily).toBe("nursing");
    expect(surveyor.roleFamily).toBe("quantity-surveying");
    expect(lawyer.roleFamily).toBe("legal-practice");
    expect(new Set([nurse.domain, surveyor.domain, lawyer.domain]).size).toBe(3);
  });

  it("never lets a stray software skill pull a clinician into engineering", () => {
    const resolution = resolveRoleFamily({
      title: "Staff Nurse",
      skills: ["JavaScript", "Patient care", "Care planning"],
      jobText: "ward based nursing role",
    });

    expect(resolution.domain).toBe("healthcare");
    expect(resolution.roleFamily).toBe("nursing");
  });

  it("falls back to a profession-specific slug when no family fits", () => {
    const resolution = resolveRoleFamily({
      title: "Marine Biologist",
      skills: ["Field research", "Data collection"],
    });

    expect(resolution.roleFamily).toBe("general-marine-biologist");
    expect(resolution.matchedBy).toBe("fallback");
  });
});

describe("normalizeSkill", () => {
  it("canonicalises common variants", () => {
    expect(normalizeSkill("React.js")).toBe("react");
    expect(normalizeSkill("NodeJS")).toBe("nodejs");
    expect(normalizeSkill("TS")).toBe("typescript");
    expect(normalizeSkill("Postgres")).toBe("postgresql");
    expect(normalizeSkill("  Tailwind CSS ")).toBe("tailwind");
  });
});

describe("buildInterviewProfile", () => {
  it("derives a frontend profile with alpha-sorted, capped skill lists", () => {
    const profile = buildInterviewProfile(
      frontendInput("Senior Frontend Engineer"),
    );

    expect(profile.roleFamily).toBe("frontend-engineering");
    expect(profile.seniorityBand).toBe("senior");
    expect(profile.coreSkills.length).toBeLessThanOrEqual(8);
    expect(profile.coreSkills).toEqual([...profile.coreSkills].sort());
    expect(profile.coreSkills).toContain("react");
    expect(profile.coreSkills).toContain("typescript");
    expect(profile.topics.length).toBeGreaterThan(0);
  });

  it("bands seniority from the title", () => {
    const bands = {
      "Frontend Engineer Intern": "entry",
      "Junior Frontend Developer": "entry",
      "Frontend Engineer": "mid",
      "Senior Frontend Engineer": "senior",
      "Frontend Tech Lead": "senior",
      "Principal Frontend Engineer": "principal",
      "Head of Frontend": "principal",
    } as const;

    for (const [title, band] of Object.entries(bands)) {
      expect(buildInterviewProfile(frontendInput(title)).seniorityBand).toBe(
        band,
      );
    }
  });

  it("routes missing required requirements into targetRequirements", () => {
    const input = frontendInput("Frontend Engineer", {
      analysis: analysisWith({
        keywordAnalysis: {
          present: FRONTEND_SKILLS,
          transferable: [],
          missing: [
            {
              keyword: "GraphQL",
              gapType: "QUALIFICATION_GAP",
              explanation: "Role wants GraphQL, resume has none.",
            },
          ],
          avoidForcing: [],
        },
        requirementMatches: [
          {
            key: "req-1",
            requirement: "5+ years building design systems",
            category: "EXPERIENCE",
            importance: "REQUIRED",
            status: "MISSING",
            resumeEvidence: null,
            explanation: "Not evidenced.",
            recommendation: null,
          },
        ],
      }),
    });

    const profile = buildInterviewProfile(input);

    expect(profile.targetRequirements).toContain("GraphQL");
    expect(profile.targetRequirements).toContain(
      "5+ years building design systems",
    );
  });

  it("works with no analysis, using only the job", () => {
    const profile = buildInterviewProfile({
      jobTitle: "Quantity Surveyor",
      jobDescription:
        "Cost planning, procurement and contract administration on commercial projects under JCT and NEC forms.",
      jobRequirements: "Cost planning, valuations, final account, tendering",
      analysis: null,
      resumeText: "Chartered quantity surveyor with 6 years of experience.",
    });

    expect(profile.roleFamily).toBe("quantity-surveying");
    expect(profile.responsibilities).toEqual([]);
    expect(profile.targetRequirements).toEqual([]);
  });
});

describe("interviewFingerprint", () => {
  it("is stable regardless of source skill ordering", async () => {
    const a = await interviewFingerprint(
      buildInterviewProfile(frontendInput("Senior Frontend Engineer")),
    );
    const shuffled = frontendInput("Senior Frontend Engineer");
    shuffled.analysis!.keywordAnalysis.present = [...FRONTEND_SKILLS].reverse();
    const b = await interviewFingerprint(buildInterviewProfile(shuffled));

    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("does not change when only secondary skills or topics differ", async () => {
    const base = buildInterviewProfile(
      frontendInput("Senior Frontend Engineer"),
    );
    const mutated = {
      ...base,
      secondarySkills: ["something", "different"],
      responsibilities: ["changed"],
      topics: ["changed"],
    };

    expect(await interviewFingerprint(mutated)).toBe(
      await interviewFingerprint(base),
    );
  });

  it("differs across unrelated professions", async () => {
    const frontend = await interviewFingerprint(
      buildInterviewProfile(frontendInput("Frontend Engineer")),
    );
    const nurse = await interviewFingerprint(
      buildInterviewProfile({
        jobTitle: "Registered Nurse",
        jobDescription:
          "Deliver ward-based patient care, medication administration and care planning.",
        jobRequirements: "NMC registration, patient care, safeguarding",
        analysis: null,
        resumeText: "Registered nurse, 4 years on an acute medical ward.",
      }),
    );
    const surveyor = await interviewFingerprint(
      buildInterviewProfile({
        jobTitle: "Quantity Surveyor",
        jobDescription:
          "Cost planning, procurement and contract administration under JCT and NEC.",
        jobRequirements: "Cost planning, valuations, tendering",
        analysis: null,
        resumeText: "Quantity surveyor with commercial project experience.",
      }),
    );

    expect(new Set([frontend, nurse, surveyor]).size).toBe(3);
  });
});
