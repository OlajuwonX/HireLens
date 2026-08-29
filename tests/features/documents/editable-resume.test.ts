import { describe, expect, it } from "vitest";
import {
  MAX_EDITED_RESUME_BYTES,
  normalizeEditableResume,
  parseEditableResume,
} from "@/features/documents/schemas/editable-resume.schema";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";

function validResume(overrides: Record<string, unknown> = {}) {
  return {
    header: {
      name: "Olayinka Olasimbo",
      headline: "Frontend Software Engineer",
      location: "Dallas, TX",
      email: "olayinka@example.com",
      phone: "(475) 559-1036",
      links: ["github.com/OlajuwonX"],
    },
    professionalSummary: "Frontend engineer with 5+ years of experience.",
    skills: [{ category: "Languages", items: ["TypeScript", "React"] }],
    experience: [
      {
        company: "PolicyCortex",
        title: "Frontend Software Engineer",
        location: "Dallas, TX",
        startDate: "2024",
        endDate: "Present",
        bullets: ["Owned the frontend architecture."],
      },
    ],
    projects: [],
    education: [
      {
        qualification: "BSc Information Technology",
        institution: "Western Governors University",
        date: "2027",
      },
    ],
    certifications: [],
    additionalSections: [],
    ...overrides,
  };
}

describe("editable resume normalisation", () => {
  it("accepts a well formed resume", () => {
    const result = parseEditableResume(validResume());

    expect(result.ok).toBe(true);
  });

  it("produces something the renderer's own schema accepts", () => {
    const result = parseEditableResume(validResume());

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(improvedResumeSchema.safeParse(result.resume).success).toBe(true);
    }
  });

  it("drops blank bullets rather than rejecting the save", () => {
    const result = parseEditableResume(
      validResume({
        experience: [
          {
            company: "PolicyCortex",
            title: "Engineer",
            location: null,
            startDate: "2024",
            endDate: "Present",
            bullets: ["Kept this", "   ", ""],
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.resume.experience[0].bullets).toEqual(["Kept this"]);
    }
  });

  it("drops an experience entry missing its required fields", () => {
    const result = parseEditableResume(
      validResume({
        experience: [
          {
            company: "",
            title: "",
            location: null,
            startDate: "",
            endDate: "",
            bullets: [],
          },
        ],
      }),
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.resume.experience).toHaveLength(0);
    }
  });

  it("trims whitespace", () => {
    const result = parseEditableResume(
      validResume({ professionalSummary: "  spaced out  " }),
    );

    expect(result.ok && result.resume.professionalSummary).toBe("spaced out");
  });

  it("requires a name", () => {
    const result = parseEditableResume(
      validResume({
        header: { ...validResume().header, name: "   " },
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("rejects a bullet beyond the field cap", () => {
    const result = parseEditableResume(
      validResume({
        experience: [
          {
            company: "PolicyCortex",
            title: "Engineer",
            location: null,
            startDate: "2024",
            endDate: "Present",
            bullets: ["x".repeat(2_001)],
          },
        ],
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("rejects more experience entries than the array cap", () => {
    const entry = validResume().experience[0];
    const result = parseEditableResume(
      validResume({ experience: Array.from({ length: 31 }, () => entry) }),
    );

    expect(result.ok).toBe(false);
  });

  it("rejects a document beyond the overall size ceiling", () => {
    const entry = {
      company: "PolicyCortex",
      title: "Engineer",
      location: null,
      startDate: "2024",
      endDate: "Present",
      bullets: Array.from({ length: 30 }, () => "y".repeat(1_900)),
    };
    const result = parseEditableResume(
      validResume({ experience: Array.from({ length: 30 }, () => entry) }),
    );

    expect(result.ok).toBe(false);
  });

  it("keeps a realistic resume well inside the size ceiling", () => {
    expect(JSON.stringify(validResume()).length).toBeLessThan(
      MAX_EDITED_RESUME_BYTES,
    );
  });

  it("survives hostile input without throwing", () => {
    for (const hostile of [
      null,
      undefined,
      "a string",
      42,
      [],
      { header: "not an object" },
      { header: { links: "not an array" } },
      { experience: [{ bullets: [{ nested: true }] }] },
      { skills: [null, undefined, 7] },
    ]) {
      expect(() => normalizeEditableResume(hostile)).not.toThrow();
      expect(() => parseEditableResume(hostile)).not.toThrow();
    }
  });

  it("does not let hostile input become a valid resume", () => {
    expect(parseEditableResume({ header: "nope" }).ok).toBe(false);
  });
});
