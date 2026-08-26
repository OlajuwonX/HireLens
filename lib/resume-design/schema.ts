import { z } from "zod";
import {
  DEFAULT_RESUME_SPACING,
  DEFAULT_RESUME_TEMPLATE,
  DEFAULT_RESUME_TYPOGRAPHY,
  RESUME_SPACING,
  RESUME_TEMPLATES,
  RESUME_TYPOGRAPHY,
} from "./constants";

export const resumeTemplateSchema = z.enum(RESUME_TEMPLATES);
export const resumeTypographySchema = z.enum(RESUME_TYPOGRAPHY);
export const resumeSpacingSchema = z.enum(RESUME_SPACING);

export const resumeDesignSelectionSchema = z.object({
  template: resumeTemplateSchema.catch(DEFAULT_RESUME_TEMPLATE),
  typography: resumeTypographySchema.catch(DEFAULT_RESUME_TYPOGRAPHY),
  spacing: resumeSpacingSchema.catch(DEFAULT_RESUME_SPACING),
});

export const strictResumeDesignSelectionSchema = z.object({
  template: resumeTemplateSchema,
  typography: resumeTypographySchema,
  spacing: resumeSpacingSchema,
});

export const resumeDownloadFormatSchema = z.enum(["PDF", "DOCX"]);

export type ResumeDesignSelection = z.infer<typeof resumeDesignSelectionSchema>;
export type ResumeDownloadFormat = z.infer<typeof resumeDownloadFormatSchema>;

export function readResumeDesignSelection(
  value: unknown,
): ResumeDesignSelection {
  const parsed = resumeDesignSelectionSchema.safeParse(value ?? {});

  return parsed.success
    ? parsed.data
    : {
        template: DEFAULT_RESUME_TEMPLATE,
        typography: DEFAULT_RESUME_TYPOGRAPHY,
        spacing: DEFAULT_RESUME_SPACING,
      };
}
