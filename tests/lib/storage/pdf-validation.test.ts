import { describe, expect, it } from "vitest";
import { StorageValidationError } from "@/lib/storage/errors";
import {
  MAX_RESUME_PDF_SIZE_BYTES,
  validateResumePdf,
  validateResumePdfMetadata,
} from "@/lib/storage/pdf-validation";

function pdfBlob(content = "%PDF-1.7 body") {
  return new Blob([content], { type: "application/pdf" });
}

describe("validateResumePdfMetadata", () => {
  it("accepts a well-formed pdf", () => {
    expect(
      validateResumePdfMetadata({
        filename: "resume.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
      }).filename,
    ).toBe("resume.pdf");
  });

  it("rejects a non-pdf extension", () => {
    expect(() =>
      validateResumePdfMetadata({
        filename: "resume.docx",
        mimeType: "application/pdf",
        sizeBytes: 2048,
      }),
    ).toThrow(StorageValidationError);
  });

  it("rejects a non-pdf mime type", () => {
    expect(() =>
      validateResumePdfMetadata({
        filename: "resume.pdf",
        mimeType: "image/png",
        sizeBytes: 2048,
      }),
    ).toThrow(StorageValidationError);
  });

  it("rejects a file over the size limit", () => {
    expect(() =>
      validateResumePdfMetadata({
        filename: "resume.pdf",
        mimeType: "application/pdf",
        sizeBytes: MAX_RESUME_PDF_SIZE_BYTES + 1,
      }),
    ).toThrow(StorageValidationError);
  });

  it("rejects an empty file", () => {
    expect(() =>
      validateResumePdfMetadata({
        filename: "resume.pdf",
        mimeType: "application/pdf",
        sizeBytes: 0,
      }),
    ).toThrow(StorageValidationError);
  });
});

describe("validateResumePdf", () => {
  it("accepts a file with a real pdf signature", async () => {
    await expect(
      validateResumePdf({
        file: pdfBlob(),
        filename: "resume.pdf",
        mimeType: "application/pdf",
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects a renamed file that is not really a pdf", async () => {
    await expect(
      validateResumePdf({
        file: new Blob(["<html>not a pdf</html>"], {
          type: "application/pdf",
        }),
        filename: "resume.pdf",
        mimeType: "application/pdf",
      }),
    ).rejects.toThrow(StorageValidationError);
  });
});
