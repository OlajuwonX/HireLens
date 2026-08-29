import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";
import { buildResumeLayout } from "@/lib/resume-render/layout";
import { loadResumeMetrics } from "@/lib/resume-render/fonts";
import { metricsUrl } from "@/lib/resume-render/client-metrics";
import {
  RESUME_TEMPLATES,
  RESUME_TYPOGRAPHY,
  resolveResumeDesign,
  resumeFontFamilies,
  type ResumeFontRole,
} from "@/lib/resume-design";
import type { ResumeMetrics } from "@/lib/resume-render/types";

const ROLES: ResumeFontRole[] = ["regular", "bold", "italic"];

const SAMPLES = [
  "Olayinka Olasimbo",
  "Frontend Software Engineer",
  "Migrated charting architecture to ApexCharts, improving rendering performance by 30%+ across enterprise datasets.",
  "José Müller Łukasz Nguyễn Thị",
  "EXPERIENCE",
  "TypeScript, Go, Python, SQL — 2019 – Present",
  "office affiliate difficult",
  " ",
];

async function clientMetricsFromDisk(slug: string): Promise<ResumeMetrics> {
  const file = JSON.parse(
    await readFile(`public/fonts/metrics-${slug}.json`, "utf8"),
  ) as {
    roles: Record<
      ResumeFontRole,
      { unitsPerEm: number; fallback: number; widths: Record<string, number> }
    >;
  };

  return {
    widthOf: (text, size, role) => {
      if (!text) {
        return 0;
      }

      const table = file.roles[role] ?? file.roles.regular;
      let total = 0;

      for (const character of text) {
        const key = (character.codePointAt(0) ?? 32).toString(36);

        total += table.widths[key] ?? table.fallback;
      }

      return (total / table.unitsPerEm) * size;
    },
  };
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
  professionalSummary: SAMPLES[2],
  skills: [{ category: "Languages", items: ["TypeScript", "React"] }],
  experience: [
    {
      company: "PolicyCortex",
      title: "Frontend Software Engineer",
      location: "Dallas, TX",
      startDate: "2024",
      endDate: "Present",
      bullets: [SAMPLES[2], SAMPLES[3]],
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

describe("client metrics match the server", () => {
  it.each(RESUME_TYPOGRAPHY)(
    "%s produces identical widths on both sides",
    async (typography) => {
      const server = await loadResumeMetrics(typography);
      const client = await clientMetricsFromDisk(
        resumeFontFamilies[typography].slug,
      );

      for (const role of ROLES) {
        for (const sample of SAMPLES) {
          const a = server.widthOf(sample, 10, role);
          const b = client.widthOf(sample, 10, role);

          expect(
            Math.abs(a - b),
            `${typography}/${role} drifted on "${sample.slice(0, 30)}"`,
          ).toBeLessThan(0.001);
        }
      }
    },
    120_000,
  );

  it.each(RESUME_TYPOGRAPHY)(
    "%s lays out a whole resume identically on both sides",
    async (typography) => {
      const server = await loadResumeMetrics(typography);
      const client = await clientMetricsFromDisk(
        resumeFontFamilies[typography].slug,
      );

      for (const template of RESUME_TEMPLATES) {
        const design = resolveResumeDesign({
          template,
          typography,
          spacing: "STANDARD",
        });
        const a = buildResumeLayout(resume, design, server);
        const b = buildResumeLayout(resume, design, client);

        expect(b.pages.length).toBe(a.pages.length);
        expect(JSON.stringify(b)).toBe(JSON.stringify(a));
      }
    },
    120_000,
  );

  it("points at a file that exists for every typeface", async () => {
    for (const typography of RESUME_TYPOGRAPHY) {
      const url = metricsUrl(typography);

      expect(url.startsWith("/fonts/metrics-")).toBe(true);
      await expect(
        readFile(`public${url}`, "utf8"),
      ).resolves.toBeTruthy();
    }
  });
});
