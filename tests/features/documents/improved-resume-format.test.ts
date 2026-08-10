import { describe, expect, it } from "vitest";
import {
  improvedResumeFilename,
  improvedResumeToText,
  improvedResumeVersionLabel,
} from "@/features/documents/improved-resume-format";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";
import { MockResumeAIProvider } from "@/lib/ai/providers/mock-resume-ai-provider";

const resume = improvedResumeSchema.parse({
  fullName: "Ada Okonkwo",
  headline: "Site Manager",
  contact: {
    email: "ada@example.com",
    phone: null,
    location: "Leeds",
    links: ["linkedin.com/in/ada"],
  },
  summary: "Site manager with delivery experience.",
  skills: [{ category: "Delivery", items: ["Planning", "Scheduling"] }],
  experience: [
    {
      role: "Site Manager",
      organisation: "Turner",
      location: "Leeds",
      startDate: "2019",
      endDate: null,
      bullets: ["Ran the site with [verified headcount] trades."],
    },
  ],
  education: [
    {
      credential: "BSc Construction Management",
      institution: "University of Leeds",
      location: null,
      completedOn: "2018",
      detail: null,
    },
  ],
  certifications: ["SMSTS"],
  changeNotes: ["Reordered experience."],
});

describe("improvedResumeToText", () => {
  it("leads with the name and headline", () => {
    const lines = improvedResumeToText(resume).split("\n");

    expect(lines[0]).toBe("Ada Okonkwo");
    expect(lines[1]).toBe("Site Manager");
  });

  it("keeps every section the resume carries", () => {
    const text = improvedResumeToText(resume);

    for (const heading of [
      "SUMMARY",
      "SKILLS",
      "EXPERIENCE",
      "EDUCATION",
      "CERTIFICATIONS",
      "WHAT CHANGED",
    ]) {
      expect(text).toContain(heading);
    }
  });

  it("shows an open-ended role as Present", () => {
    expect(improvedResumeToText(resume)).toContain("2019 - Present");
  });

  it("preserves placeholders rather than inventing numbers", () => {
    expect(improvedResumeToText(resume)).toContain("[verified headcount]");
  });

  it("omits sections that are empty", () => {
    const text = improvedResumeToText({
      ...resume,
      certifications: [],
      changeNotes: [],
    });

    expect(text).not.toContain("CERTIFICATIONS");
    expect(text).not.toContain("WHAT CHANGED");
  });
});

describe("improvedResumeFilename", () => {
  it("builds a safe pdf filename", () => {
    expect(improvedResumeFilename("Ada Okonkwo", "Site Manager")).toBe(
      "ada-okonkwo-site-manager.pdf",
    );
  });

  it("strips characters that break storage keys", () => {
    expect(improvedResumeFilename("Ada / Okonkwo", "C++ Dev")).toBe(
      "ada-okonkwo-c-dev.pdf",
    );
  });

  it("falls back when nothing usable remains", () => {
    expect(improvedResumeFilename("", "")).toBe("improved-resume.pdf");
  });
});

describe("improvedResumeVersionLabel", () => {
  it("names the job it was tailored for", () => {
    expect(improvedResumeVersionLabel("Site Manager")).toBe(
      "AI-assisted - Site Manager",
    );
  });

  it("still marks the version when there is no job title", () => {
    expect(improvedResumeVersionLabel(null)).toBe("AI-assisted");
  });

  it("stays within the label column", () => {
    expect(improvedResumeVersionLabel("x".repeat(400)).length).toBe(120);
  });
});

describe("the mock provider stays valid against the schema", () => {
  it("returns output the improved resume schema accepts", async () => {
    const result = await new MockResumeAIProvider().generateImprovedResume({
      resume: { pdfBase64: "", filename: "resume.pdf", text: null },
      jobTitle: "Site Manager",
      company: "Turner",
      jobDescription: "Run the site.",
      requirements: null,
      notes: null,
    });

    expect(() =>
      improvedResumeSchema.parse(JSON.parse(String(result.rawResponse))),
    ).not.toThrow();
  });
});
