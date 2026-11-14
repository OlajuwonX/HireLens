import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { interviewPreps } from "@/lib/db/schema";

export async function ensurePendingPrep(input: { userId: string; applicationId: string; emailEventId: string | null }) {
  const [row] = await db
    .insert(interviewPreps)
    .values({ ...input, status: "PENDING" })
    .onConflictDoUpdate({
      target: interviewPreps.applicationId,
      set: { emailEventId: input.emailEventId, updatedAt: new Date() },
    })
    .returning();

  return row;
}

export async function findPrepForUser(input: { userId: string; publicId: string }) {
  const [row] = await db
    .select()
    .from(interviewPreps)
    .where(and(eq(interviewPreps.userId, input.userId), eq(interviewPreps.publicId, input.publicId)))
    .limit(1);

  return row ?? null;
}

export async function savePrepResult(input: {
  userId: string;
  id: string;
  status: "READY" | "FAILED" | "PENDING";
  resultJson?: unknown;
  failureReason?: string | null;
}) {
  await db
    .update(interviewPreps)
    .set({
      status: input.status,
      ...(input.resultJson === undefined ? {} : { resultJson: input.resultJson }),
      failureReason: input.failureReason ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(interviewPreps.userId, input.userId), eq(interviewPreps.id, input.id)));
}
