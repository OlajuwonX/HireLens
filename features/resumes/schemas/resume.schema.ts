import { z } from "zod";

export const resumePublicIdSchema = z.string().uuid();

export const createResumeMetadataSchema = z.object({
  title: z.string().trim().min(1, "Resume name is required").max(120),
});

export const renameResumeSchema = z.object({
  publicId: resumePublicIdSchema,
  title: z.string().trim().min(1, "Resume name is required").max(120),
});

export const resumeActionSchema = z.object({
  publicId: resumePublicIdSchema,
});
