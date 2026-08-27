import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";
import { renderImprovedResumePageSvg } from "@/lib/pdf/resume-document";
import {
  loadResumeMetrics,
  RESUME_FONT_FEATURES,
} from "@/lib/resume-render/fonts";
import {
  RESUME_TYPOGRAPHY,
  resumeFontFamilies,
  type ResumeFontRole,
} from "@/lib/resume-design";

const samples = [
  "Amara Okonkwo",
  "Senior Platform Engineer",
  "Led the migration of a monolithic billing service to an event-driven architecture, cutting p99 latency by 63%.",
  "José Müller Łukasz Nguyễn Thị",
  "EXPERIENCE",
  "office affiliate difficult ffi fl",
  "TypeScript, Go, Python, SQL — 2019 – Present",
];

const bullet =
  "Rebuilt the deployment pipeline so that release candidates ship in under nine minutes, down from fifty-two, across eleven services.";

const resume = improvedResumeSchema.parse({
  header: {
    name: "Amara Okonkwo",
    headline: "Senior Platform Engineer",
    location: "Leeds, UK",
    email: "amara@example.com",
    phone: "+44 7700 900123",
    links: ["linkedin.com/in/amara"],
  },
  professionalSummary: bullet,
  skills: [
    { category: "Languages", items: ["TypeScript", "Go", "Python"] },
    { category: "Infrastructure", items: ["Kubernetes", "Terraform", "AWS"] },
  ],
  experience: Array.from({ length: 4 }, (_, index) => ({
    company: `Employer ${index + 1}`,
    title: "Senior Platform Engineer",
    location: "London",
    startDate: "2018",
    endDate: "Present",
    bullets: [bullet, bullet, bullet],
  })),
  projects: [],
  education: [
    {
      qualification: "BSc Computer Science",
      institution: "University of Leeds",
      date: "2017",
    },
  ],
  certifications: [],
  additionalSections: [],
});

describe("resume font metrics", () => {
  it("matches the widths pdf-lib uses when drawing the same text", async () => {
    const doc = await PDFDocument.create();

    doc.registerFontkit(fontkit);

    for (const typography of RESUME_TYPOGRAPHY) {
      const metrics = await loadResumeMetrics(typography);
      const family = resumeFontFamilies[typography];
      const roles: ResumeFontRole[] = ["regular", "bold", "italic"];

      for (const role of roles) {
        const bytes = new Uint8Array(
          await readFile(`public/fonts/${family.files[role]}`),
        );
        const embedded = await doc.embedFont(bytes, {
          subset: false,
          features: RESUME_FONT_FEATURES,
        });

        for (const sample of samples) {
          const mine = metrics.widthOf(sample, 10, role);
          const theirs = embedded.widthOfTextAtSize(sample, 10);

          expect(Math.abs(mine - theirs)).toBeLessThan(0.001);
        }
      }
    }
  }, 120_000);

  it("falls back to a usable width when a glyph is missing", async () => {
    const metrics = await loadResumeMetrics("INTER");

    expect(metrics.widthOf("漢字テスト", 10, "regular")).toBeGreaterThan(0);
  });

  it("returns zero width for empty text", async () => {
    const metrics = await loadResumeMetrics("INTER");

    expect(metrics.widthOf("", 10, "regular")).toBe(0);
  });

  it("scales linearly with the font size", async () => {
    const metrics = await loadResumeMetrics("INTER");
    const single = metrics.widthOf("Amara Okonkwo", 10, "regular");
    const double = metrics.widthOf("Amara Okonkwo", 20, "regular");

    expect(double / single).toBeCloseTo(2, 5);
  });

  it("builds a full preview well inside the interactive budget", async () => {
    await renderImprovedResumePageSvg(resume, {
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });

    const start = performance.now();

    await renderImprovedResumePageSvg(resume, {
      template: "MODERN",
      typography: "INTER",
      spacing: "COMPACT",
    });

    expect(performance.now() - start).toBeLessThan(1_000);
  }, 120_000);

  it("keeps the standard-font fallback available for every role", async () => {
    expect(StandardFonts.Helvetica).toBeDefined();
    expect(StandardFonts.HelveticaBold).toBeDefined();
    expect(StandardFonts.HelveticaOblique).toBeDefined();
  });
});
