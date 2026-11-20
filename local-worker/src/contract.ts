import { z } from "zod";

const nullableText = z.string().nullable();

export const candidateSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  email: z.string(),
  phone: nullableText,
  location: nullableText,
  linkedinUrl: nullableText,
  githubUrl: nullableText,
  portfolioUrl: nullableText,
  authorizedCountries: z.array(z.string()),
  requiresSponsorship: z.boolean().nullable(),
  willingToRelocate: z.boolean().nullable(),
  salaryMin: z.number().nullable(),
  salaryCurrency: nullableText,
  noticePeriodWeeks: z.number().nullable(),
  yearsExperience: z.number().nullable(),
});

export const taskPayloadSchema = z.object({
  task: z.object({ id: z.string(), platform: nullableText, url: nullableText }),
  job: z.object({ title: z.string(), company: z.string() }),
  candidate: candidateSchema,
  answers: z.array(z.object({ question: z.string(), answer: z.string() })),
  coverLetter: nullableText,
  resumePath: z.string(),
});

export const claimResponseSchema = z.object({
  task: taskPayloadSchema.nullable(),
  reason: z.string().optional(),
});

export type Candidate = z.infer<typeof candidateSchema>;
export type TaskPayload = z.infer<typeof taskPayloadSchema>;

export type WorkerOutcome = "SUBMITTED" | "UNCONFIRMED" | "NEEDS_MANUAL_ACTION" | "FAILED";

export type WorkerResult = {
  taskId: string;
  outcome: WorkerOutcome;
  reason: string;
  missing: string[];
  evidence?: { finalUrl?: string; confirmationText?: string };
};
