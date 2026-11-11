import { z } from "zod";

export const validationCodes = [
  "UNSUPPORTED_NUMBER",
  "INFLATED_YEARS",
  "CHANGED_DATE",
  "UNSUPPORTED_TECHNOLOGY",
  "LOST_NUMBER",
  "UNTRACED_SOURCE",
  "DROP_WITHOUT_REASON",
  "MISSING_SECTION",
] as const;

export const validationIssueSchema = z.object({
  code: z.enum(validationCodes),
  severity: z.enum(["ERROR", "WARNING"]),
  detail: z.string(),
});

export const resumeValidationSchema = z.object({
  issues: z.array(validationIssueSchema),
  errorCount: z.number().int(),
});

export type ValidationCode = (typeof validationCodes)[number];
export type ValidationIssue = z.infer<typeof validationIssueSchema>;
export type ResumeValidation = z.infer<typeof resumeValidationSchema>;
