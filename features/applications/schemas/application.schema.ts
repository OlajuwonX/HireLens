import { z } from "zod";
import {
  APPLICATION_SORT_OPTIONS,
  APPLICATION_STAGES,
} from "../constants";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalDate = z.preprocess(blankToUndefined, z.coerce.date().optional());

export const applicationPublicIdSchema = z.string().uuid();

export const createApplicationSchema = z.object({
  jobPublicId: z.string().uuid(),
  resumeVersionPublicId: z.preprocess(
    blankToUndefined,
    z.string().uuid().optional(),
  ),
  stage: z.enum(APPLICATION_STAGES).default("SAVED"),
});

export const updateApplicationSchema = z.object({
  publicId: applicationPublicIdSchema,
  stage: z.enum(APPLICATION_STAGES),
  resumeVersionPublicId: z.preprocess(
    blankToUndefined,
    z.string().uuid().optional(),
  ),
  appliedAt: optionalDate,
  followUpAt: optionalDate,
  interviewAt: optionalDate,
  notes: z.preprocess(
    blankToUndefined,
    z.string().trim().max(10_000).optional(),
  ),
});

export const changeStageSchema = z.object({
  publicId: applicationPublicIdSchema,
  stage: z.enum(APPLICATION_STAGES),
});

export const applicationActionSchema = z.object({
  publicId: applicationPublicIdSchema,
});

export const applicationFiltersSchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().trim().max(200).optional()),
  stage: z.enum(APPLICATION_STAGES).optional(),
  sort: z.enum(APPLICATION_SORT_OPTIONS).default("activity_desc"),
  view: z.enum(["list", "pipeline"]).default("list"),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationFilters = z.infer<typeof applicationFiltersSchema>;
