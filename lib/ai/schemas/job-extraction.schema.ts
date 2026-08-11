import { z } from "zod";
import {
  EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
} from "@/features/jobs/constants";

export const JOB_CONTENT_MIN_LENGTH = 50;
export const JOB_CONTENT_MAX_LENGTH = 60_000;

export const extractedJobSchema = z.object({
  title: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  workArrangement: z.enum(WORK_ARRANGEMENTS).nullable(),
  employmentType: z.enum(EMPLOYMENT_TYPES).nullable(),
  salaryMin: z.number().int().min(0).max(100_000_000).nullable(),
  salaryMax: z.number().int().min(0).max(100_000_000).nullable(),
  currency: z.string().nullable(),
  source: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  description: z.string().nullable(),
  requirements: z.string().nullable(),
});

export type ExtractedJob = z.infer<typeof extractedJobSchema>;

export const jobExtractionInputSchema = z.object({
  content: z
    .string()
    .trim()
    .min(
      JOB_CONTENT_MIN_LENGTH,
      "Paste a bit more of the posting so HireLens can read it.",
    )
    .max(
      JOB_CONTENT_MAX_LENGTH,
      "That posting is too long. Paste the job details only.",
    ),
});

export type JobExtractionInput = z.infer<typeof jobExtractionInputSchema>;
