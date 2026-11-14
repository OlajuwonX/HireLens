import "server-only";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications, emailEvents, interviewPreps, jobs } from "@/lib/db/schema";

export async function existingMessageIds(input: { userId: string; messageIds: string[] }) {
  if (input.messageIds.length === 0) {
    return new Set<string>();
  }

  const rows = await db
    .select({ messageId: emailEvents.messageId })
    .from(emailEvents)
    .where(and(eq(emailEvents.userId, input.userId), inArray(emailEvents.messageId, input.messageIds)));

  return new Set(rows.map((row) => row.messageId));
}

export async function insertEmailEvent(values: typeof emailEvents.$inferInsert) {
  const [row] = await db.insert(emailEvents).values(values).onConflictDoNothing().returning();

  return row ?? null;
}

export async function listApplicationCandidates(userId: string) {
  return db
    .select({ id: applications.id, publicId: applications.publicId, company: jobs.company, title: jobs.title })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(and(eq(applications.userId, userId), isNull(applications.archivedAt)))
    .orderBy(desc(applications.lastActivityAt))
    .limit(300);
}

export async function listResponses(userId: string) {
  return db
    .select({
      publicId: emailEvents.publicId,
      fromAddress: emailEvents.fromAddress,
      subject: emailEvents.subject,
      snippet: emailEvents.snippet,
      receivedAt: emailEvents.receivedAt,
      kind: emailEvents.kind,
      confidence: emailEvents.confidence,
      status: emailEvents.status,
      company: jobs.company,
      title: jobs.title,
      applicationPublicId: applications.publicId,
      prepPublicId: interviewPreps.publicId,
      prepStatus: interviewPreps.status,
    })
    .from(emailEvents)
    .leftJoin(applications, eq(applications.id, emailEvents.applicationId))
    .leftJoin(jobs, eq(jobs.id, applications.jobId))
    .leftJoin(interviewPreps, eq(interviewPreps.applicationId, emailEvents.applicationId))
    .where(and(eq(emailEvents.userId, userId), inArray(emailEvents.status, ["AUTO", "NEEDS_REVIEW", "CONFIRMED"])))
    .orderBy(desc(emailEvents.receivedAt))
    .limit(100);
}

export type ResponseRow = Awaited<ReturnType<typeof listResponses>>[number];

export async function findEventForUser(input: { userId: string; publicId: string }) {
  const [row] = await db
    .select()
    .from(emailEvents)
    .where(and(eq(emailEvents.userId, input.userId), eq(emailEvents.publicId, input.publicId)))
    .limit(1);

  return row ?? null;
}

export async function updateEvent(input: {
  userId: string;
  id: string;
  set: Partial<Pick<typeof emailEvents.$inferInsert, "status" | "kind" | "applicationId">>;
}) {
  await db
    .update(emailEvents)
    .set({ ...input.set, updatedAt: new Date() })
    .where(and(eq(emailEvents.userId, input.userId), eq(emailEvents.id, input.id)));
}
