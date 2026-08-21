import { z } from "zod";

export const resumePublicIdSchema = z.string().uuid();

export const renameResumeSchema = z.object({
  publicId: resumePublicIdSchema,
  title: z.string().trim().min(1, "Job title is required").max(120),
});

export const resumeActionSchema = z.object({
  publicId: resumePublicIdSchema,
});
