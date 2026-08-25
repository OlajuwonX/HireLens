import { describe, expect, it } from "vitest";
import {
  applicationIntelligenceSchema,
  storedApplicationIntelligenceSchema,
} from "@/lib/ai/schemas/application-intelligence.schema";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";
import { toGeminiResponseSchema } from "@/lib/ai/gemini-json-schema";
import { toStrictJsonSchema } from "@/lib/ai/json-schema";

const legacyImprovedResume = {
  header: {
    name: "Ada Okonkwo",
    headline: "Quantity Surveyor",
    location: "Leeds",
    email: "ada@example.com",
    phone: null,
    links: [],
  },
  professionalSummary: "Quantity surveyor working on public sector frameworks.",
  skills: [{ category: "Cost", items: ["Cost planning"] }],
  experience: [
    {
      company: "Turner",
      title: "Quantity Surveyor",
      location: "Leeds",
      startDate: "2019",
      endDate: "Present",
      bullets: ["Ran cost planning across a £1.2m programme."],
    },
  ],
  projects: [],
  education: [
    {
      qualification: "BSc Quantity Surveying",
      institution: "University of Leeds",
      date: "2018",
    },
  ],
};

const legacyStoredAnalysis = {
  scoring: {
    overallScore: 71,
    atsScore: 74,
    requirementsScore: 65,
    skillsScore: 70,
    experienceScore: 68,
    keywordScore: 72,
    explanation: "Stored before the optimization plan existed.",
  },
  recommendations: [],
  keywordAnalysis: {
    present: ["Cost planning"],
    transferable: [],
    missing: [],
    avoidForcing: [],
  },
  requirementMatches: [],
  improvedResume: legacyImprovedResume,
  bulletRewrites: [],
  professionalSummary: "Quantity surveyor.",
  coverLetter: "Dear hiring manager.",
  applicationEmail: { subject: "Application", body: "Please find attached." },
  followUpMessage: "Following up on my application.",
};

describe("an analysis stored before this change stays readable", () => {
  const parsed =
    storedApplicationIntelligenceSchema.parse(legacyStoredAnalysis);

  it("keeps the improved resume instead of falling back to an empty one", () => {
    expect(parsed.improvedResume.header.name).toBe("Ada Okonkwo");
    expect(parsed.improvedResume.experience).toHaveLength(1);
    expect(parsed.improvedResume.education).toHaveLength(1);
  });

  it("fills the new resume sections with empty arrays", () => {
    expect(parsed.improvedResume.certifications).toEqual([]);
    expect(parsed.improvedResume.additionalSections).toEqual([]);
  });

  it("supplies a neutral optimization plan for the missing field", () => {
    expect(parsed.optimizationPlan.alignment).toBe("MEDIUM");
    expect(parsed.optimizationPlan.intensity).toBe("TARGETED");
    expect(parsed.optimizationPlan.droppedEvidence).toEqual([]);
  });

  it("leaves every previously stored section intact", () => {
    expect(parsed.scoring.overallScore).toBe(71);
    expect(parsed.coverLetter).toBe("Dear hiring manager.");
    expect(parsed.applicationEmail.subject).toBe("Application");
    expect(parsed.followUpMessage).toBe("Following up on my application.");
  });
});

describe("the improved resume schema stays backward compatible", () => {
  it("parses a resume written before certifications existed", () => {
    const resume = improvedResumeSchema.parse(legacyImprovedResume);

    expect(resume.certifications).toEqual([]);
    expect(resume.additionalSections).toEqual([]);
  });

  it("TEST H: carries a certification with its issuer and date", () => {
    const resume = improvedResumeSchema.parse({
      ...legacyImprovedResume,
      certifications: [
        { name: "MRICS", issuer: "RICS", date: "2022" },
        { name: "CSCS Card", issuer: null, date: null },
      ],
      additionalSections: [{ title: "Languages", items: ["English", "Igbo"] }],
    });

    expect(resume.certifications[0]).toEqual({
      name: "MRICS",
      issuer: "RICS",
      date: "2022",
    });
    expect(resume.additionalSections[0].items).toEqual(["English", "Igbo"]);
  });
});

describe("the generation schema still reaches both providers intact", () => {
  it("requires the new fields of the model", () => {
    const schema = toGeminiResponseSchema(applicationIntelligenceSchema) as {
      required: string[];
      properties: {
        improvedResume: { required: string[] };
      };
    };

    expect(schema.required).toContain("optimizationPlan");
    expect(schema.properties.improvedResume.required).toEqual(
      expect.arrayContaining(["certifications", "additionalSections"]),
    );
  });

  it("keeps the OpenRouter strict schema derivable", () => {
    const schema = toStrictJsonSchema(applicationIntelligenceSchema) as {
      required: string[];
    };

    expect(schema.required).toEqual(
      expect.arrayContaining([
        "requirementMatches",
        "keywordAnalysis",
        "optimizationPlan",
        "improvedResume",
        "scoring",
      ]),
    );
  });

  it("puts the evidence analysis before the rewrite it drives", () => {
    const keys = Object.keys(applicationIntelligenceSchema.shape);

    expect(keys.indexOf("requirementMatches")).toBeLessThan(
      keys.indexOf("improvedResume"),
    );
    expect(keys.indexOf("keywordAnalysis")).toBeLessThan(
      keys.indexOf("improvedResume"),
    );
    expect(keys.indexOf("optimizationPlan")).toBeLessThan(
      keys.indexOf("improvedResume"),
    );
  });
});
