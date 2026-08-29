import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import {
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  type PDFRef,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";
import { renderImprovedResumePdf } from "@/lib/pdf/resume-document";
import {
  RESUME_TEMPLATES,
  RESUME_TYPOGRAPHY,
  resumeFontFamilies,
  type ResumeFontRole,
} from "@/lib/resume-design";

const SAMPLE =
  "Olayinka Olasimbo Frontend Software Engineer PolicyCortex Dallas TX " +
  "Migrated charting architecture improving rendering performance by 30% " +
  "José Müller Nguyễn";

type ProgramReport = { glyphs: number; outlines: number; ratio: number };

async function embeddedFontPrograms(pdf: Uint8Array): Promise<ProgramReport[]> {
  const doc = await PDFDocument.load(pdf);
  const reports: ProgramReport[] = [];

  doc.context.enumerateIndirectObjects().forEach(([, object]) => {
    if (!(object instanceof PDFDict)) {
      return;
    }

    if (String(object.get(PDFName.of("Type")) ?? "") !== "/FontDescriptor") {
      return;
    }

    const reference = object.get(PDFName.of("FontFile2"));

    if (!reference) {
      return;
    }

    const stream = doc.context.lookup(reference as PDFRef);

    if (!(stream instanceof PDFRawStream)) {
      return;
    }

    let program: Uint8Array = stream.contents;

    try {
      program = new Uint8Array(inflateSync(Buffer.from(stream.contents)));
    } catch {
      program = stream.contents;
    }

    const font = fontkit.create(program) as unknown as {
      numGlyphs: number;
      getGlyph: (id: number) => { path: { commands: unknown[] } };
    };

    let outlines = 0;

    for (let id = 0; id < font.numGlyphs; id += 1) {
      try {
        if (font.getGlyph(id).path.commands.length > 0) {
          outlines += 1;
        }
      } catch {
        continue;
      }
    }

    reports.push({
      glyphs: font.numGlyphs,
      outlines,
      ratio: font.numGlyphs === 0 ? 0 : outlines / font.numGlyphs,
    });
  });

  return reports;
}

const resume = improvedResumeSchema.parse({
  header: {
    name: "Olayinka Olasimbo",
    headline: "Frontend Software Engineer",
    location: "Dallas, TX",
    email: "olayinka@example.com",
    phone: "(475) 559-1036",
    links: ["github.com/OlajuwonX"],
  },
  professionalSummary: SAMPLE,
  skills: [{ category: "Languages", items: ["TypeScript", "React", "Next.js"] }],
  experience: [
    {
      company: "PolicyCortex",
      title: "Frontend Software Engineer",
      location: "Dallas, TX",
      startDate: "2024",
      endDate: "Present",
      bullets: [SAMPLE, SAMPLE],
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
});

describe("bundled font files survive subsetting", () => {
  it.each(RESUME_TYPOGRAPHY)(
    "%s embeds real glyph outlines for every role",
    async (typography) => {
      const family = resumeFontFamilies[typography];
      const roles: ResumeFontRole[] = ["regular", "bold", "italic"];

      for (const role of roles) {
        const doc = await PDFDocument.create();

        doc.registerFontkit(fontkit);

        const bytes = new Uint8Array(
          await readFile(`public/fonts/${family.files[role]}`),
        );
        const font = await doc.embedFont(bytes, { subset: true });
        const page = doc.addPage([612, 792]);

        page.drawText(SAMPLE.slice(0, 80), { x: 40, y: 700, size: 10, font });
        page.drawText(SAMPLE.slice(80), { x: 40, y: 680, size: 10, font });

        const [report] = await embeddedFontPrograms(await doc.save());

        expect(report, `${typography}/${role} embedded no font program`).toBeDefined();
        expect(
          report.ratio,
          `${typography}/${role} subset kept only ${report.outlines}/${report.glyphs} outlines`,
        ).toBeGreaterThan(0.9);
      }
    },
    120_000,
  );
});

describe("rendered resumes carry usable glyphs", () => {
  it.each(RESUME_TYPOGRAPHY)(
    "a full resume rendered with %s has drawable outlines",
    async (typography) => {
      const bytes = await renderImprovedResumePdf(resume, {
        template: "CLASSIC",
        typography,
        spacing: "STANDARD",
      });
      const reports = await embeddedFontPrograms(bytes);

      expect(reports.length).toBeGreaterThan(0);

      for (const report of reports) {
        expect(report.ratio).toBeGreaterThan(0.9);
      }
    },
    120_000,
  );

  it.each(RESUME_TEMPLATES)(
    "%s renders with intact outlines on the default typeface",
    async (template) => {
      const bytes = await renderImprovedResumePdf(resume, {
        template,
        typography: "INTER",
        spacing: "STANDARD",
      });

      for (const report of await embeddedFontPrograms(bytes)) {
        expect(report.ratio).toBeGreaterThan(0.9);
      }
    },
    120_000,
  );
});
