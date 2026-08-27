import { z } from "zod";
import {
  resumeSpacingSchema,
  resumeTemplateSchema,
  resumeTypographySchema,
} from "@/lib/resume-design";
import { documentPublicIdSchema } from "./document.schema";

export const saveResumeDesignSchema = z.object({
  publicId: documentPublicIdSchema,
  template: resumeTemplateSchema,
  typography: resumeTypographySchema,
  spacing: resumeSpacingSchema,
});

export type SaveResumeDesignInput = z.infer<typeof saveResumeDesignSchema>;
