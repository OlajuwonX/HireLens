import { z } from "zod";
import { MAX_RESUME_PDF_SIZE_BYTES } from "@/lib/storage";

export const resumeVersionPublicIdSchema = z.string().uuid();

export const uploadResumeSchema = z
  .object({
    resumePublicId: z.string().uuid().optional(),
    title: z
      .string()
      .trim()
      .min(1, "Job title is required")
      .max(120, "Job title must be 120 characters or fewer")
      .optional(),
  })
  .refine((value) => Boolean(value.resumePublicId) !== Boolean(value.title), {
    message: "Enter a job title or pick an existing one",
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
