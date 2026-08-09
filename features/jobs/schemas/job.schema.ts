import { z } from "zod";
import {
  EMPLOYMENT_TYPES,
  JOB_SORT_OPTIONS,
  JOB_STATUSES,
  WORK_ARRANGEMENTS,
} from "../constants";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const optionalMoney = z.preprocess(
  blankToUndefined,
  z.coerce.number().int().min(0).max(100_000_000).optional(),
);

export const jobPublicIdSchema = z.string().uuid();

export const createJobSchema = z
  .object({
    title: z.string().trim().min(1, "Job title is required").max(200),
    company: z.string().trim().min(1, "Company is required").max(200),
    location: optionalText(200),
    workArrangement: z.enum(WORK_ARRANGEMENTS).default("NOT_SPECIFIED"),
    employmentType: z.enum(EMPLOYMENT_TYPES).default("NOT_SPECIFIED"),
    salaryMin: optionalMoney,
    salaryMax: optionalMoney,
    currency: optionalText(8),
    source: optionalText(120),
    sourceUrl: z.preprocess(
      blankToUndefined,
      z.url("Enter a valid URL, including https://").max(2048).optional(),
    ),
    description: z
      .string()
      .trim()
      .min(1, "Job description is required")
      .max(50_000),
    requirements: optionalText(20_000),
    deadlineAt: z.preprocess(
      blankToUndefined,
      z.coerce.date().optional(),
    ),
    notes: optionalText(10_000),
  })
  .refine(
    (job) =>
      job.salaryMin === undefined ||
      job.salaryMax === undefined ||
      job.salaryMin <= job.salaryMax,
    {
      path: ["salaryMax"],
      message: "Maximum salary must be greater than the minimum",
    },
  );

export const updateJobSchema = z.intersection(
  createJobSchema,
  z.object({ publicId: jobPublicIdSchema }),
);

export const jobActionSchema = z.object({ publicId: jobPublicIdSchema });

export const jobFiltersSchema = z.object({
  q: optionalText(200),
  status: z.enum(JOB_STATUSES).optional(),
  arrangement: z.enum(WORK_ARRANGEMENTS).optional(),
  sort: z.enum(JOB_SORT_OPTIONS).default("created_desc"),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobFilters = z.infer<typeof jobFiltersSchema>;
