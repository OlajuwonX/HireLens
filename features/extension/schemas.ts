import { z } from "zod";

export const fillRequestSchema = z.object({ url: z.url().max(4096) });

export const applicationRefSchema = z.object({ applicationPublicId: z.uuid() });

export const resumeQuerySchema = z.object({ application: z.uuid().optional() });

export const importPageSchema = z.object({
  url: z.url().max(4096),
  title: z.string().max(500).default(""),
  text: z.string().min(1).max(60_000),
});

export const boostRequestSchema = applicationRefSchema;

export const formQuestionSchema = z.object({
  id: z.string().min(1).max(200),
  label: z.string().trim().min(1).max(1_000),
  kind: z.enum(["text", "textarea", "select", "radio"]),
  required: z.boolean(),
  options: z.array(z.string().max(300)).max(60),
  maxLength: z.number().int().positive().max(20_000).nullable(),
});

export const answersRequestSchema = z.object({
  url: z.url().max(4096),
  applicationPublicId: z.uuid().nullable(),
  pageText: z.string().max(20_000).default(""),
  questions: z.array(formQuestionSchema).min(1).max(20),
});

export type AnswersRequest = z.infer<typeof answersRequestSchema>;
