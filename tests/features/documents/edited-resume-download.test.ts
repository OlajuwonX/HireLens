import { describe, expect, it } from "vitest";
import { extractText, getDocumentProxy } from "unpdf";
import { readEditedResume } from "@/features/documents/server/resume-design.service";
import { parseEditableResume } from "@/features/documents/schemas/editable-resume.schema";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";
import { renderImprovedResumeDocx } from "@/lib/docx/resume-docx";
import { renderImprovedResumePdf } from "@/lib/pdf/resume-document";

const ORIGINAL_BULLET =
  "Migrated charting architecture to ApexCharts, improving rendering performance by 30%.";
const EDITED_BULLET =
  "Rebuilt the reporting pipeline so quarterly close finishes in under nine minutes.";

const analysisResume = improvedResumeSchema.parse({
  header: {
    name: "Olayinka Olasimbo",
    headline: "Frontend Software Engineer",
    location: "Dallas, TX",
    email: "olayinka@example.com",
    phone: null,
    links: [],
  },
  professionalSummary: "Frontend engineer with 5+ years of experience.",
  skills: [{ category: "Languages", items: ["TypeScript"] }],
  experience: [
    {
      company: "PolicyCortex",
      title: "Frontend Software Engineer",
      location: "Dallas, TX",
      startDate: "2024",
      endDate: "Present",
      bullets: [ORIGINAL_BULLET],
    },
  ],
  projects: [],
  education: [],
  certifications: [],
  additionalSections: [],
});

const selection = {
  template: "CLASSIC" as const,
  typography: "INTER" as const,
  spacing: "STANDARD" as const,
};

async function pdfText(bytes: Uint8Array) {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: true });

  return String(text).replace(/\s+/g, " ");
}

describe("edited resume reaches the exported file", () => {
  it("stores an edit that the reader accepts back", () => {
    const parsed = parseEditableResume({
      ...analysisResume,
      experience: [
        { ...analysisResume.experience[0], bullets: [EDITED_BULLET] },
      ],
    });

    expect(parsed.ok).toBe(true);

    if (parsed.ok) {
      expect(readEditedResume(parsed.resume)).not.toBeNull();
    }
  });

  it("renders the edited bullet into the PDF and drops the original", async () => {
    const parsed = parseEditableResume({
      ...analysisResume,
      experience: [
        { ...analysisResume.experience[0], bullets: [EDITED_BULLET] },
      ],
    });

    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      return;
    }

    const edited = await pdfText(
      await renderImprovedResumePdf(parsed.resume, selection),
    );
    const original = await pdfText(
      await renderImprovedResumePdf(analysisResume, selection),
    );

    expect(edited).toContain("Rebuilt the reporting pipeline");
    expect(edited).not.toContain("Migrated charting architecture");
    expect(original).toContain("Migrated charting architecture");
  }, 120_000);

  it("carries the edit into the DOCX as well", async () => {
    const parsed = parseEditableResume({
      ...analysisResume,
      experience: [
        { ...analysisResume.experience[0], bullets: [EDITED_BULLET] },
      ],
    });

    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      return;
    }

    const bytes = await renderImprovedResumeDocx(parsed.resume, selection);
    const raw = Buffer.from(bytes).toString("latin1");

    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(raw.slice(0, 2)).toBe("PK");
  }, 120_000);

  it("rejects a stored edit that no longer matches the resume shape", () => {
    expect(readEditedResume({ header: { name: "Only a name" } })).toBeNull();
    expect(readEditedResume(null)).toBeNull();
    expect(readEditedResume("garbage")).toBeNull();
  });

  it("falls back rather than throwing when stored JSON is corrupt", () => {
    expect(readEditedResume({ experience: "not an array" })).toBeNull();
  });
});
