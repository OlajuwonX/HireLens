import "server-only";

import { renderCoverLetterDocx } from "@/lib/docx/cover-letter-document";
import { renderCoverLetterPdf } from "@/lib/pdf/cover-letter-document";
import { coverLetterFilename } from "../cover-letter-format";

export type RenderedCoverLetterFile = {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
};

export async function renderCoverLetterDownload(input: {
  text: string;
  role: string | null;
  company: string | null;
  format: "PDF" | "DOCX";
}): Promise<RenderedCoverLetterFile> {
  if (input.format === "DOCX") {
    return {
      bytes: await renderCoverLetterDocx(input.text),
      filename: coverLetterFilename(input.role, input.company, "docx"),
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }

  return {
    bytes: await renderCoverLetterPdf(input.text),
    filename: coverLetterFilename(input.role, input.company, "pdf"),
    contentType: "application/pdf",
  };
}
