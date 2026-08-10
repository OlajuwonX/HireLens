import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { renderImprovedResumePdf } from "@/lib/pdf/resume-document";
import { improvedResumeSchema } from "@/lib/ai/schemas/improved-resume.schema";

const longBullet =
  "Delivered a multi-site programme covering [verified scope] across twelve regional teams, cutting handover delays by [verified percentage] while keeping every safety audit clear.";

function resumeWith(overrides: Record<string, unknown> = {}) {
  return improvedResumeSchema.parse({
    fullName: "Ada Okonkwo",
    headline: "Site Manager",
    contact: {
      email: "ada@example.com",
      phone: null,
      location: "Leeds",
      links: [],
    },
    summary: longBullet,
    skills: [{ category: "Delivery", items: ["Programme planning"] }],
    experience: [
      {
        role: "Site Manager",
        organisation: "Turner",
        location: "Leeds",
        startDate: "2019",
        endDate: null,
        bullets: [longBullet],
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
    changeNotes: ["Led with site leadership."],
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
    const doc = await PDFDocument.load(await renderImprovedResumePdf(resumeWith()));
    const [page] = doc.getPages();

    expect(page.getWidth()).toBe(612);
    expect(page.getHeight()).toBe(792);
  });

  it("titles the document with the candidate name", async () => {
    const doc = await PDFDocument.load(await renderImprovedResumePdf(resumeWith()));

    expect(doc.getTitle()).toBe("Ada Okonkwo - Resume");
  });

  it("fits a short resume on one page", async () => {
    const doc = await PDFDocument.load(await renderImprovedResumePdf(resumeWith()));

    expect(doc.getPageCount()).toBe(1);
  });

  it("adds pages instead of overflowing a long resume", async () => {
    const doc = await PDFDocument.load(
      await renderImprovedResumePdf(
        resumeWith({
          experience: Array.from({ length: 10 }, (_, index) => ({
            role: `Site Manager ${index + 1}`,
            organisation: "Turner",
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
        education: [],
        certifications: [],
        changeNotes: [],
      }),
    );

    await expect(PDFDocument.load(bytes)).resolves.toBeDefined();
  });

  it("does not throw on characters outside WinAnsi", async () => {
    const bytes = await renderImprovedResumePdf(
      resumeWith({ fullName: "Ada Okonkwo 🚀", summary: "Built “things” — fast…" }),
    );

    await expect(PDFDocument.load(bytes)).resolves.toBeDefined();
  });
});
