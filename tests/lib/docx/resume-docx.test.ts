import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";
import { renderImprovedResumeDocx } from "@/lib/docx/resume-docx";
import {
  RESUME_SPACING,
  RESUME_TEMPLATES,
  RESUME_TYPOGRAPHY,
  type ResumeDesignSelection,
} from "@/lib/resume-design";

const bullet =
  "Delivered a multi-site programme covering [verified scope] across twelve regional teams.";

function resumeWith(overrides: Record<string, unknown> = {}) {
  return improvedResumeSchema.parse({
    header: {
      name: "Ada Okonkwo",
      headline: "Site Manager",
      location: "Leeds",
      email: "ada@example.com",
      phone: "+44 7700 900000",
      links: ["linkedin.com/in/ada"],
    },
    professionalSummary: bullet,
    skills: [{ category: "Delivery", items: ["Programme planning"] }],
    experience: [
      {
        company: "Turner",
        title: "Site Manager",
        location: "Leeds",
        startDate: "2019",
        endDate: "Present",
        bullets: [bullet],
      },
    ],
    projects: [],
    education: [
      {
        qualification: "BSc Construction Management",
        institution: "University of Leeds",
        date: "2018",
      },
    ],
    certifications: [{ name: "SMSTS", issuer: "CITB", date: "2021" }],
    additionalSections: [],
    ...overrides,
  });
}

function zipEntryNames(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const names: string[] = [];

  for (let offset = 0; offset + 30 <= bytes.length; offset += 1) {
    if (view.getUint32(offset, true) !== 0x04034b50) {
      continue;
    }

    const nameLength = view.getUint16(offset + 26, true);

    names.push(
      decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameLength)),
    );
  }

  return names;
}

function readZipEntry(bytes: Uint8Array, entry: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();

  for (let offset = 0; offset + 30 <= bytes.length; offset += 1) {
    if (view.getUint32(offset, true) !== 0x04034b50) {
      continue;
    }

    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = decoder.decode(
      bytes.subarray(offset + 30, offset + 30 + nameLength),
    );

    if (name !== entry || compressedSize === 0) {
      continue;
    }

    const start = offset + 30 + nameLength + extraLength;
    const payload = bytes.subarray(start, start + compressedSize);

    return decoder.decode(
      method === 0 ? payload : inflateRawSync(Buffer.from(payload)),
    );
  }

  return null;
}

const everyCombination: ResumeDesignSelection[] = RESUME_TEMPLATES.flatMap(
  (template) =>
    RESUME_TYPOGRAPHY.flatMap((typography) =>
      RESUME_SPACING.map((spacing) => ({ template, typography, spacing })),
    ),
);

describe("renderImprovedResumeDocx", () => {
  it.each(everyCombination)(
    "produces a valid docx for $template / $typography / $spacing",
    async (selection) => {
      const bytes = await renderImprovedResumeDocx(resumeWith(), selection);

      expect(bytes.byteLength).toBeGreaterThan(1000);
      expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);

      const names = zipEntryNames(bytes);

      expect(names).toContain("[Content_Types].xml");
      expect(names).toContain("word/document.xml");
    },
    30_000,
  );

  it("keeps the resume content editable inside the document body", async () => {
    const bytes = await renderImprovedResumeDocx(resumeWith(), {
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });
    const xml = readZipEntry(bytes, "word/document.xml");

    expect(xml).toBeTruthy();
    expect(xml).toContain("Ada Okonkwo");
    expect(xml).toContain("Site Manager");
    expect(xml).toContain("Turner");
    expect(xml).toContain("University of Leeds");
    expect(xml).toContain("SMSTS");
    expect(xml).toContain("<w:p>");
    expect(xml).toContain("<w:numPr>");
  }, 30_000);

  it("keeps the separators around contact details", async () => {
    const bytes = await renderImprovedResumeDocx(resumeWith(), {
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });
    const xml = readZipEntry(bytes, "word/document.xml") ?? "";

    expect(xml).toContain("> • <");
    expect(xml).not.toContain(">•<");
  }, 30_000);

  it("keeps the space after a skills category", async () => {
    const bytes = await renderImprovedResumeDocx(resumeWith(), {
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });
    const xml = readZipEntry(bytes, "word/document.xml") ?? "";

    expect(xml).toContain("Delivery: <");
  }, 30_000);

  it("uses US Letter pages so it matches the PDF", async () => {
    const bytes = await renderImprovedResumeDocx(resumeWith(), {
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });
    const xml = readZipEntry(bytes, "word/document.xml") ?? "";

    expect(xml).toContain('w:w="12240"');
    expect(xml).toContain('w:h="15840"');
  }, 30_000);

  it("keeps the date tab stop inside the text column", async () => {
    const bytes = await renderImprovedResumeDocx(resumeWith(), {
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });
    const xml = readZipEntry(bytes, "word/document.xml") ?? "";
    const tab = Number(/<w:tab w:val="right" w:pos="(\d+)"/.exec(xml)?.[1]);
    const left = Number(/w:left="(\d+)"/.exec(xml)?.[1]);
    const right = Number(/w:right="(\d+)"/.exec(xml)?.[1]);

    expect(tab).toBeGreaterThan(0);
    expect(tab).toBeLessThanOrEqual(12240 - left - right);
  }, 30_000);

  it("links a contact URL rather than leaving it as plain text", async () => {
    const bytes = await renderImprovedResumeDocx(resumeWith(), {
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });
    const xml = readZipEntry(bytes, "word/document.xml") ?? "";

    expect(xml).toContain("<w:hyperlink");
  }, 30_000);

  it("carries the selected typeface into the runs", async () => {
    const bytes = await renderImprovedResumeDocx(resumeWith(), {
      template: "EDITORIAL",
      typography: "SOURCE_SERIF_4",
      spacing: "STANDARD",
    });
    const xml = readZipEntry(bytes, "word/document.xml");

    expect(xml).toContain("Source Serif 4");
  }, 30_000);

  it("uses different spacing for compact and standard", async () => {
    const [compact, standard] = await Promise.all([
      renderImprovedResumeDocx(resumeWith(), {
        template: "CLASSIC",
        typography: "INTER",
        spacing: "COMPACT",
      }),
      renderImprovedResumeDocx(resumeWith(), {
        template: "CLASSIC",
        typography: "INTER",
        spacing: "STANDARD",
      }),
    ]);

    expect(readZipEntry(compact, "word/document.xml")).not.toBe(
      readZipEntry(standard, "word/document.xml"),
    );
  }, 30_000);

  it("keeps a non-ASCII name intact", async () => {
    const bytes = await renderImprovedResumeDocx(
      resumeWith({
        header: {
          name: "José Müller",
          headline: "Ingénieur",
          location: null,
          email: null,
          phone: null,
          links: [],
        },
      }),
      { template: "CLASSIC", typography: "INTER", spacing: "STANDARD" },
    );

    expect(readZipEntry(bytes, "word/document.xml")).toContain("José Müller");
  }, 30_000);

  it("renders when every optional section is empty", async () => {
    const bytes = await renderImprovedResumeDocx(
      resumeWith({
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        additionalSections: [],
      }),
      { template: "MODERN", typography: "SOURCE_SANS_3", spacing: "COMPACT" },
    );

    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  }, 30_000);
});
