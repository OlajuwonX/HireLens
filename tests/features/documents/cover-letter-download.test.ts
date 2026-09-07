import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { extractText, getDocumentProxy } from "unpdf";
import { coverLetterFilename } from "@/features/documents/cover-letter-format";
import { renderCoverLetterDownload } from "@/features/documents/server/cover-letter.service";

const LETTER = [
  "Dear Hiring Team,",
  "I am applying for the Senior Frontend Engineer role at Northwind. Over the past six years I have shipped accessible, fast interfaces for teams that measure their work in retention and revenue, and your product roadmap lines up closely with that experience.",
  "At my current company I led the rebuild of the onboarding flow, which lifted activation by nineteen percent and cut support tickets in half. I would bring the same focus on measurable outcomes to Northwind.",
  "Thank you for your time. I would welcome the chance to talk.",
  "Sincerely,\nAda Okonkwo",
].join("\n\n");

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

async function pdfText(bytes: Uint8Array) {
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: true });

  return String(text).replace(/\s+/g, " ");
}

describe("coverLetterFilename", () => {
  it("builds cover-letter-<role>-<company>", () => {
    expect(
      coverLetterFilename("Senior Frontend Engineer", "Northwind Co.", "pdf"),
    ).toBe("cover-letter-senior-frontend-engineer-northwind-co.pdf");
  });

  it("keeps the docx extension", () => {
    expect(coverLetterFilename("Analyst", "Acme", "docx")).toBe(
      "cover-letter-analyst-acme.docx",
    );
  });

  it("drops missing role and company", () => {
    expect(coverLetterFilename(null, null, "pdf")).toBe("cover-letter.pdf");
    expect(coverLetterFilename("  ", null, "docx")).toBe("cover-letter.docx");
  });

  it("caps the slug length", () => {
    const name = coverLetterFilename("x".repeat(200), "y".repeat(200), "pdf");

    expect(name.length).toBeLessThanOrEqual(85);
    expect(name.endsWith(".pdf")).toBe(true);
  });
});

describe("renderCoverLetterDownload", () => {
  it("renders a PDF that carries the letter text", async () => {
    const file = await renderCoverLetterDownload({
      text: LETTER,
      role: "Senior Frontend Engineer",
      company: "Northwind",
      format: "PDF",
    });

    expect(file.contentType).toBe("application/pdf");
    expect(file.filename).toBe(
      "cover-letter-senior-frontend-engineer-northwind.pdf",
    );
    expect([...file.bytes.slice(0, 5)]).toEqual([0x25, 0x50, 0x44, 0x46, 0x2d]);

    const text = await pdfText(file.bytes);

    expect(text).toContain("Dear Hiring Team");
    expect(text).toContain("activation by nineteen percent");
    expect(text).toContain("Ada Okonkwo");
  }, 30_000);

  it("renders a DOCX with the letter text in the body", async () => {
    const file = await renderCoverLetterDownload({
      text: LETTER,
      role: "Senior Frontend Engineer",
      company: "Northwind",
      format: "DOCX",
    });

    expect(file.contentType).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(file.filename).toBe(
      "cover-letter-senior-frontend-engineer-northwind.docx",
    );
    expect([...file.bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);

    const xml = readZipEntry(file.bytes, "word/document.xml") ?? "";

    expect(xml).toContain("Dear Hiring Team");
    expect(xml).toContain("Ada Okonkwo");
    expect(xml).toContain('w:w="12240"');
    expect(xml).toContain("Inter");
  }, 30_000);

  it("still produces a file for an empty letter", async () => {
    const file = await renderCoverLetterDownload({
      text: "",
      role: null,
      company: null,
      format: "DOCX",
    });

    expect([...file.bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(file.filename).toBe("cover-letter.docx");
  }, 30_000);
});
