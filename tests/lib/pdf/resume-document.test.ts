import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { renderImprovedResumePdf } from "@/lib/pdf/resume-document";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";

const longBullet =
  "Delivered a multi-site programme covering [verified scope] across twelve regional teams, cutting handover delays by [verified percentage] while keeping every safety audit clear.";

function resumeWith(overrides: Record<string, unknown> = {}) {
  return improvedResumeSchema.parse({
    header: {
      name: "Ada Okonkwo",
      headline: "Site Manager",
      location: "Leeds",
      email: "ada@example.com",
      phone: null,
      links: [],
    },
    professionalSummary: longBullet,
    skills: [{ category: "Delivery", items: ["Programme planning"] }],
    experience: [
      {
        company: "Turner",
        title: "Site Manager",
        location: "Leeds",
        startDate: "2019",
        endDate: "Present",
        bullets: [longBullet],
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
    ...overrides,
  });
}

describe("renderImprovedResumePdf", () => {
  it("produces bytes a PDF reader accepts", async () => {
    const bytes = await renderImprovedResumePdf(resumeWith());

    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    await expect(PDFDocument.load(bytes)).resolves.toBeDefined();
  });

  it("uses US Letter pages", async () => {
    const doc = await PDFDocument.load(
      await renderImprovedResumePdf(resumeWith()),
    );
    const [page] = doc.getPages();

    expect(page.getWidth()).toBe(612);
    expect(page.getHeight()).toBe(792);
  });

  it("titles the document with the candidate name", async () => {
    const doc = await PDFDocument.load(
      await renderImprovedResumePdf(resumeWith()),
    );

    expect(doc.getTitle()).toBe("Ada Okonkwo - Resume");
  });

  it("fits a short resume on one page", async () => {
    const doc = await PDFDocument.load(
      await renderImprovedResumePdf(resumeWith()),
    );

    expect(doc.getPageCount()).toBe(1);
  });

  it("adds pages instead of overflowing a long resume", async () => {
    const doc = await PDFDocument.load(
      await renderImprovedResumePdf(
        resumeWith({
          experience: Array.from({ length: 10 }, (_, index) => ({
            company: "Turner",
            title: `Site Manager ${index + 1}`,
            location: "Leeds",
            startDate: "2019",
            endDate: "2024",
            bullets: [longBullet, longBullet, longBullet],
          })),
        }),
      ),
    );

    expect(doc.getPageCount()).toBeGreaterThan(1);
  });

  it("renders when every optional section is empty", async () => {
    const bytes = await renderImprovedResumePdf(
      resumeWith({
        skills: [],
        experience: [],
        projects: [],
        education: [],
      }),
    );

    await expect(PDFDocument.load(bytes)).resolves.toBeDefined();
  });

  it("does not throw on characters outside WinAnsi", async () => {
    const bytes = await renderImprovedResumePdf(
      resumeWith({
        header: {
          name: "Ada Okonkwo 🚀",
          headline: "Site Manager",
          location: null,
          email: null,
          phone: null,
          links: [],
        },
        professionalSummary: "Built “things” — fast…",
      }),
    );

    await expect(PDFDocument.load(bytes)).resolves.toBeDefined();
  });
});
