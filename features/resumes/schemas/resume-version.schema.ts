import { z } from "zod";
import { MAX_RESUME_PDF_SIZE_BYTES } from "@/lib/storage";

export const resumeVersionPublicIdSchema = z.string().uuid();

export const createResumeVersionSchema = z.object({
  resumePublicId: z.string().uuid(),
  label: z.string().trim().min(1, "Version label is required").max(120),
});

export const resumeUploadFileSchema = z
  .instanceof(File, { message: "Select a resume PDF to upload" })
  .refine((file) => file.size > 0, "Select a resume PDF to upload")
  .refine(
    (file) => file.size <= MAX_RESUME_PDF_SIZE_BYTES,
    "The resume must be 10MB or smaller",
  );

export const defaultResumeVersionSchema = z.object({
  versionPublicId: resumeVersionPublicIdSchema,
});
