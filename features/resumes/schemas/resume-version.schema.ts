import { z } from "zod";

export const resumeVersionPublicIdSchema = z.string().uuid();

export const createResumeVersionSchema = z.object({
  resumePublicId: z.string().uuid(),
  fileAssetPublicId: z.string().uuid(),
  label: z.string().trim().min(1, "Version label is required").max(120),
});

export const defaultResumeVersionSchema = z.object({
  versionPublicId: resumeVersionPublicIdSchema,
});
