import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { NewAdminErrorEvent } from "@/lib/db/schema";

export function verifySentrySignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

const sentryIssueWebhookSchema = z.object({
  data: z.object({
    issue: z.object({
      id: z.string(),
      title: z.string(),
      culprit: z.string().nullable().optional(),
      level: z.string().nullable().optional(),
      count: z.union([z.string(), z.number()]).optional(),
      firstSeen: z.string().nullable().optional(),
      lastSeen: z.string().nullable().optional(),
      permalink: z.string().nullable().optional(),
    }),
    event: z.object({ event_id: z.string().optional() }).optional(),
  }),
});

export function mapSentryIssuePayload(json: unknown): NewAdminErrorEvent | null {
  const parsed = sentryIssueWebhookSchema.safeParse(json);

  if (!parsed.success) {
    return null;
  }

  const { issue, event } = parsed.data.data;
  const rawCount =
    typeof issue.count === "string" ? Number.parseInt(issue.count, 10) : issue.count;
  const eventCount = Number.isFinite(rawCount) && (rawCount as number) > 0 ? (rawCount as number) : 1;

  return {
    issueId: issue.id,
    sentryEventId: event?.event_id ?? null,
    title: issue.title,
    level: issue.level ?? null,
    culprit: issue.culprit ?? null,
    environment: null,
    eventCount,
    firstSeen: issue.firstSeen ? new Date(issue.firstSeen) : null,
    lastSeen: issue.lastSeen ? new Date(issue.lastSeen) : null,
    permalink: issue.permalink ?? null,
  };
}
