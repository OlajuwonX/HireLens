import { describe, expect, it, vi } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractPdfText, readResumeText } from "@/lib/pdf/extract-text";

async function buildPdf(lines: string[]) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const page = document.addPage([612, 792]);

  lines.forEach((line, index) => {
    page.drawText(line, { x: 54, y: 720 - index * 24, size: 12, font });
  });

  return document.save();
}

describe("extractPdfText", () => {
  it("reads the text a resume PDF carries", async () => {
    const bytes = await buildPdf([
      "Jane Doe",
      "Senior Backend Engineer",
      "Built payment systems with Node.js and Postgres",
    ]);

    const text = await extractPdfText(bytes);

    expect(text).toContain("Jane Doe");
    expect(text).toContain("Senior Backend Engineer");
    expect(text).toContain("Postgres");
  });

  it("leaves the caller's bytes usable afterwards", async () => {
    const bytes = await buildPdf(["Jane Doe"]);
    const byteLength = bytes.byteLength;

    await extractPdfText(bytes);

    expect(bytes.byteLength).toBe(byteLength);
    expect(Buffer.from(bytes).toString("base64").length).toBeGreaterThan(0);
  });
});

describe("readResumeText", () => {
  it("returns the extracted text when the document can be read", async () => {
    const bytes = await buildPdf(["Jane Doe", "Engineer"]);

    await expect(readResumeText(bytes)).resolves.toContain("Jane Doe");
  });

  it("returns null instead of throwing when the file is not a PDF", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      readResumeText(new TextEncoder().encode("this is not a pdf")),
    ).resolves.toBeNull();
  });

  it("returns null for a PDF with no readable text", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const document = await PDFDocument.create();
    document.addPage([612, 792]);

    await expect(readResumeText(await document.save())).resolves.toBeNull();
  });
});
