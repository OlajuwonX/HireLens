import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";
import { BUG_CATEGORIES, BUG_STATUSES } from "../constants";

export const createBugReportSchema = z.object({
  category: z.enum(BUG_CATEGORIES, {
    message: "Choose a category",
  }),
  title: z
    .string()
    .trim()
    .min(3, "Give the report a short title")
    .max(120, "Keep the title under 120 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Tell us a little more about what happened")
    .max(4_000, "Keep the description under 4,000 characters"),
  route: z.preprocess(blankToUndefined, z.string().trim().max(512).optional()),
  sentryEventId: z.preprocess(
    blankToUndefined,
    z.string().trim().max(64).optional(),
  ),
});

export const updateBugStatusSchema = z.object({
  publicId: z.string().uuid(),
  status: z.enum(BUG_STATUSES),
});

export const bugFiltersSchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().trim().max(200).optional()),
  status: z.preprocess(blankToUndefined, z.enum(BUG_STATUSES).optional()),
  category: z.preprocess(blankToUndefined, z.enum(BUG_CATEGORIES).optional()),
});

export type CreateBugReportInput = z.infer<typeof createBugReportSchema>;
export type BugFilters = z.infer<typeof bugFiltersSchema>;
