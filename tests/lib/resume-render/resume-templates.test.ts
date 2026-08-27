import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";
import { extractPdfText } from "@/lib/pdf/extract-text";
import {
  buildImprovedResumeLayout,
  renderImprovedResumePageSvg,
  renderImprovedResumePdf,
} from "@/lib/pdf/resume-document";
import {
  RESUME_SPACING,
  RESUME_TEMPLATES,
  RESUME_TYPOGRAPHY,
  resolveResumeDesign,
  type ResumeDesignSelection,
} from "@/lib/resume-design";
import {
  RESUME_PAGE_HEIGHT,
  RESUME_PAGE_WIDTH,
  type ResumeLayout,
} from "@/lib/resume-render/types";

const bullet =
  "Delivered a multi-site programme covering [verified scope] across twelve regional teams, cutting handover delays by [verified percentage] while keeping every safety audit clear.";

function resumeWith(overrides: Record<string, unknown> = {}) {
  return improvedResumeSchema.parse({
    header: {
      name: "Ada Okonkwo",
      headline: "Site Manager",
      location: "Leeds",
      email: "ada@example.com",
      phone: "+44 7700 900000",
      links: ["linkedin.com/in/ada"],
      ...(overrides.header as object satisfies object | undefined),
    },
    professionalSummary: bullet,
    skills: [
      { category: "Delivery", items: ["Programme planning", "Scheduling"] },
    ],
    experience: [
      {
        company: "Turner",
        title: "Site Manager",
        location: "Leeds",
        startDate: "2019",
        endDate: "Present",
        bullets: [bullet, bullet],
      },
    ],
    projects: [
      {
        name: "Northern depot rebuild",
        technologies: ["Primavera P6", "BIM"],
        bullets: [bullet],
      },
    ],
    education: [
      {
        qualification: "BSc Construction Management",
        institution: "University of Leeds",
        date: "2018",
      },
    ],
    certifications: [{ name: "SMSTS", issuer: "CITB", date: "2021" }],
    additionalSections: [
      { title: "Languages", items: ["English", "Igbo"] },
    ],
    ...overrides,
  });
}

const everyCombination: ResumeDesignSelection[] = RESUME_TEMPLATES.flatMap(
  (template) =>
    RESUME_TYPOGRAPHY.flatMap((typography) =>
      RESUME_SPACING.map((spacing) => ({ template, typography, spacing })),
    ),
);

function overflowsMargins(layout: ResumeLayout, selection: ResumeDesignSelection) {
  const design = resolveResumeDesign(selection);
  const right = RESUME_PAGE_WIDTH - design.margin.right;
  const bottom = RESUME_PAGE_HEIGHT - design.margin.bottom;

  for (const page of layout.pages) {
    for (const run of page.runs) {
      if (run.x < 0 || run.y > bottom + run.size || run.y < 0) {
        return true;
      }
    }

    for (const rule of page.rules) {
      if (rule.x < 0 || rule.x + rule.width > right + 1) {
        return true;
      }
    }
  }

  return false;
}

describe("resume template matrix", () => {
  it("covers four templates, three typefaces and two spacings", () => {
    expect(everyCombination).toHaveLength(24);
  });

  it.each(everyCombination)(
    "renders a valid PDF for $template / $typography / $spacing",
    async (selection) => {
      const bytes = await renderImprovedResumePdf(resumeWith(), selection);

      expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");

      const doc = await PDFDocument.load(bytes);
      const [page] = doc.getPages();

      expect(page.getWidth()).toBe(RESUME_PAGE_WIDTH);
      expect(page.getHeight()).toBe(RESUME_PAGE_HEIGHT);
    },
    30_000,
  );

  it.each(everyCombination)(
    "keeps every run inside the page for $template / $typography / $spacing",
    async (selection) => {
      const layout = await buildImprovedResumeLayout(resumeWith(), selection);

      expect(overflowsMargins(layout, selection)).toBe(false);
    },
  );

  it.each(RESUME_TEMPLATES)(
    "fits more content per page at compact spacing for %s",
    async (template) => {
      const standard = await buildImprovedResumeLayout(
        resumeWith({
          experience: Array.from({ length: 4 }, () => ({
            company: "Turner",
            title: "Site Manager",
            location: "Leeds",
            startDate: "2019",
            endDate: "2024",
            bullets: [bullet, bullet],
          })),
        }),
        { template, typography: "INTER", spacing: "STANDARD" },
      );
      const compact = await buildImprovedResumeLayout(
        resumeWith({
          experience: Array.from({ length: 4 }, () => ({
            company: "Turner",
            title: "Site Manager",
            location: "Leeds",
            startDate: "2019",
            endDate: "2024",
            bullets: [bullet, bullet],
          })),
        }),
        { template, typography: "INTER", spacing: "COMPACT" },
      );

      const runsOnFirstPage = (layout: ResumeLayout) =>
        layout.pages[0].runs.length;

      expect(runsOnFirstPage(compact)).toBeGreaterThanOrEqual(
        runsOnFirstPage(standard),
      );
    },
  );
});

describe("resume content edge cases", () => {
  const cases: [string, Record<string, unknown>][] = [
    [
      "a very long name and headline",
      {
        header: {
          name: "Bartholomew Fitzgerald-Montgomery Wintersmith III",
          headline:
            "Principal Programme Director for Infrastructure Delivery and Capital Works",
          location: "Kingston upon Hull, East Riding of Yorkshire",
          email: "bartholomew.fitzgerald@averylongdomainnameindeed.example.com",
          phone: "+44 7700 900000",
          links: ["linkedin.com/in/bartholomew-fitzgerald-montgomery"],
        },
      },
    ],
    [
      "a non-ASCII name",
      {
        header: {
          name: "José Nguyễn Łukasz Müller",
          headline: "Ingénieur Principal",
          location: "Zürich",
          email: "jose@example.com",
          phone: null,
          links: [],
        },
      },
    ],
    [
      "an unusually long date range",
      {
        experience: [
          {
            company: "Turner",
            title: "Site Manager",
            location: "Leeds",
            startDate: "September 2019 (secondment from January 2018)",
            endDate: "Present, transitioning to an advisory role",
            bullets: [bullet],
          },
        ],
      },
    ],
    [
      "one enormous bullet",
      {
        experience: [
          {
            company: "Turner",
            title: "Site Manager",
            location: "Leeds",
            startDate: "2019",
            endDate: "Present",
            bullets: [bullet.repeat(6)],
          },
        ],
      },
    ],
    [
      "an unbroken string with no spaces",
      {
        professionalSummary: "A".repeat(400),
      },
    ],
    [
      "many experience entries",
      {
        experience: Array.from({ length: 12 }, (_, index) => ({
          company: `Employer ${index + 1}`,
          title: `Site Manager ${index + 1}`,
          location: "Leeds",
          startDate: "2019",
          endDate: "2024",
          bullets: [bullet, bullet, bullet],
        })),
      },
    ],
    [
      "no optional sections at all",
      {
        skills: [],
        projects: [],
        education: [],
        certifications: [],
        additionalSections: [],
      },
    ],
    [
      "no experience at all",
      { experience: [], projects: [], skills: [] },
    ],
  ];

  it.each(cases)("stays inside the page with %s", async (_label, overrides) => {
    for (const template of RESUME_TEMPLATES) {
      const selection: ResumeDesignSelection = {
        template,
        typography: "INTER",
        spacing: "COMPACT",
      };
      const layout = await buildImprovedResumeLayout(
        resumeWith(overrides),
        selection,
      );

      expect(overflowsMargins(layout, selection)).toBe(false);
    }
  });

  it.each(cases)("renders a loadable PDF with %s", async (_label, overrides) => {
    const bytes = await renderImprovedResumePdf(resumeWith(overrides), {
      template: "MODERN",
      typography: "SOURCE_SERIF_4",
      spacing: "STANDARD",
    });

    await expect(PDFDocument.load(bytes)).resolves.toBeDefined();
  }, 30_000);
});

describe("ATS behaviour", () => {
  it.each(RESUME_TEMPLATES)(
    "keeps %s text extractable and in reading order",
    async (template) => {
      const bytes = await renderImprovedResumePdf(resumeWith(), {
        template,
        typography: "INTER",
        spacing: "STANDARD",
      });
      const text = await extractPdfText(bytes);

      expect(text).toContain("Ada Okonkwo");
      expect(text).toContain("Site Manager");
      expect(text).toContain("Turner");
      expect(text).toContain("University of Leeds");

      expect(text.indexOf("Ada Okonkwo")).toBeLessThan(
        text.indexOf("University of Leeds"),
      );
    },
    30_000,
  );

  it("keeps recognisable section headings", async () => {
    const bytes = await renderImprovedResumePdf(resumeWith(), {
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });
    const text = (await extractPdfText(bytes)).toUpperCase();

    for (const heading of [
      "SUMMARY",
      "SKILLS",
      "EXPERIENCE",
      "PROJECTS",
      "EDUCATION",
      "CERTIFICATIONS",
    ]) {
      expect(text).toContain(heading);
    }
  }, 30_000);

  it("preserves a non-ASCII name through to the extracted text", async () => {
    const bytes = await renderImprovedResumePdf(
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
    const text = await extractPdfText(bytes);

    expect(text).toContain("José Müller");
  }, 30_000);

  it("uses a real bullet character rather than a hyphen", async () => {
    const layout = await buildImprovedResumeLayout(resumeWith(), {
      template: "CLASSIC",
      typography: "INTER",
      spacing: "STANDARD",
    });
    const glyphs = layout.pages.flatMap((page) =>
      page.runs.filter((run) => run.text === "•"),
    );

    expect(glyphs.length).toBeGreaterThan(0);
  });
});

describe("resume preview", () => {
  it.each(everyCombination)(
    "returns page one SVG for $template / $typography / $spacing",
    async (selection) => {
      const { svg, pageCount } = await renderImprovedResumePageSvg(
        resumeWith(),
        selection,
      );

      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain(`viewBox="0 0 612 792"`);
      expect(pageCount).toBeGreaterThanOrEqual(1);
    },
  );

  it("escapes text that would otherwise break the markup", async () => {
    const { svg } = await renderImprovedResumePageSvg(
      resumeWith({
        header: {
          name: "Ada <script>alert(1)</script> & Co",
          headline: "Site Manager",
          location: null,
          email: null,
          phone: null,
          links: [],
        },
      }),
      { template: "CLASSIC", typography: "INTER", spacing: "STANDARD" },
    );

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("&amp;");
  });

  it("reports the real page count for a long resume", async () => {
    const { pageCount } = await renderImprovedResumePageSvg(
      resumeWith({
        experience: Array.from({ length: 12 }, () => ({
          company: "Turner",
          title: "Site Manager",
          location: "Leeds",
          startDate: "2019",
          endDate: "2024",
          bullets: [bullet, bullet, bullet],
        })),
      }),
      { template: "CLASSIC", typography: "INTER", spacing: "STANDARD" },
    );

    expect(pageCount).toBeGreaterThan(1);
  });
});
