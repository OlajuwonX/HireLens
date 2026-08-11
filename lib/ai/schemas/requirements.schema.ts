import { z } from "zod";

export const requirementCategories = [
  "SKILL",
  "EXPERIENCE",
  "EDUCATION",
  "CERTIFICATION",
  "RESPONSIBILITY",
  "LOCATION",
  "OTHER",
] as const;

export const requirementStatuses = [
  "STRONG",
  "PARTIAL",
  "MISSING",
  "UNCLEAR",
] as const;

export const requirementMatchSchema = z.object({
  key: z.string().min(1),
  requirement: z.string().min(1),
  category: z.enum(requirementCategories),
  importance: z.enum(["REQUIRED", "PREFERRED"]),
  status: z.enum(requirementStatuses),
  resumeEvidence: z.string().nullable(),
  explanation: z.string().min(1),
  recommendation: z.string().nullable(),
});

export type RequirementMatch = z.infer<typeof requirementMatchSchema>;
