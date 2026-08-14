import { z } from "zod";
import { StorageValidationError } from "./errors";

export const MAX_RESUME_PDF_SIZE_BYTES = 10 * 1024 * 1024;

export const resumePdfMetadataSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(255)
    .regex(/\.pdf$/i, "File must use a .pdf extension"),
  mimeType: z.literal("application/pdf"),
  sizeBytes: z.number().int().positive().max(MAX_RESUME_PDF_SIZE_BYTES),
});

export type ResumePdfMetadata = z.infer<typeof resumePdfMetadataSchema>;

export function validateResumePdfMetadata(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const result = resumePdfMetadataSchema.safeParse(input);

  if (!result.success) {
    throw new StorageValidationError(
      result.error.issues[0]?.message ?? "Invalid PDF metadata",
    );
  }

  return result.data;
}

export async function validatePdfSignature(file: Blob) {
  const header = await file.slice(0, 5).text();

  if (header !== "%PDF-") {
    throw new StorageValidationError("File signature is not a valid PDF");
  }
}

export async function validateResumePdf(input: {
  file: Blob;
  filename: string;
  mimeType: string;
}) {
  validateResumePdfMetadata({
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.file.size,
  });

  await validatePdfSignature(input.file);
}
