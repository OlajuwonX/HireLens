import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";
import {
  APPLICATION_SORT_OPTIONS,
  APPLICATION_STATUSES,
  APPLICATION_TABS,
} from "../constants";
import {
  jobFieldsSchema,
  salaryRangeIssue,
  salaryRangeIsOrdered,
} from "@/features/jobs/schemas/job.schema";

const optionalDate = z.preprocess(blankToUndefined, z.coerce.date().optional());

export const applicationPublicIdSchema = z.string().uuid();

export const saveAndAnalyzeSchema = jobFieldsSchema
  .extend({
    resumeVersionPublicId: z.string().uuid("Select a resume version"),
  })
  .refine(salaryRangeIsOrdered, salaryRangeIssue);

export const updateApplicationSchema = z.object({
  publicId: applicationPublicIdSchema,
  status: z.enum(APPLICATION_STATUSES),
  resumeVersionPublicId: z.preprocess(
    blankToUndefined,
    z.string().uuid().optional(),
  ),
  appliedAt: optionalDate,
  followUpAt: optionalDate,
  notes: z.preprocess(
    blankToUndefined,
    z.string().trim().max(10_000).optional(),
  ),
});

export const changeStatusSchema = z.object({
  publicId: applicationPublicIdSchema,
  status: z.enum(APPLICATION_STATUSES),
});

export const applicationActionSchema = z.object({
  publicId: applicationPublicIdSchema,
});

export const applicationFiltersSchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().trim().max(200).optional()),
  tab: z.enum(APPLICATION_TABS).default("PENDING"),
  sort: z.enum(APPLICATION_SORT_OPTIONS).default("activity_desc"),
});

export type SaveAndAnalyzeInput = z.infer<typeof saveAndAnalyzeSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationFilters = z.infer<typeof applicationFiltersSchema>;
