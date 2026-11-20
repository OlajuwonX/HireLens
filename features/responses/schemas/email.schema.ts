import { z } from "zod";
import { RESPONSE_KINDS } from "@/lib/responses/classify";

export const MAX_EMAILS_PER_BATCH = 25;

export const inboundEmailSchema = z.object({
  messageId: z.string().trim().min(1).max(200),
  threadId: z.string().trim().max(200).optional(),
  from: z.string().trim().min(3).max(320),
  subject: z.string().trim().max(500),
  receivedAt: z.iso.datetime({ offset: true }),
  text: z.string().max(6_000),
});

export const emailBatchSchema = z.object({
  emails: z.array(inboundEmailSchema).max(MAX_EMAILS_PER_BATCH),
});

export const reviewEventSchema = z.object({
  publicId: z.uuid(),
  kind: z.enum(RESPONSE_KINDS),
  applicationPublicId: z.preprocess((value) => (value === "" ? undefined : value), z.uuid().optional()),
});

export type InboundEmail = z.infer<typeof inboundEmailSchema>;
