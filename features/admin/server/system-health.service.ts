import "server-only";

import { and, count, eq, gt, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  adminErrorEvents,
  aiUsageReservations,
  interviewQuestionPools,
} from "@/lib/db/schema";

const DB_CHECK_TIMEOUT_MS = 2_000;
const RECENT_ERROR_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function withTimeout<T>(
  work: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timed out")), timeoutMs);
  });

  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function checkDatabase(): Promise<{
  reachable: boolean;
  latencyMs: number | null;
}> {
  const startedAt = Date.now();

  try {
    await withTimeout(db.execute(sql`select 1`), DB_CHECK_TIMEOUT_MS);
    return { reachable: true, latencyMs: Date.now() - startedAt };
  } catch {
    return { reachable: false, latencyMs: null };
  }
}

export async function countPendingInterviewPools(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(interviewQuestionPools)
    .where(eq(interviewQuestionPools.status, "PENDING"));

  return row?.value ?? 0;
}

export async function countActiveAiReservations(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(aiUsageReservations)
    .where(
      and(
        gt(aiUsageReservations.expiresAt, new Date()),
        isNull(aiUsageReservations.completedAt),
        isNull(aiUsageReservations.failedAt),
      ),
    );

  return row?.value ?? 0;
}

export async function countRecentErrors(): Promise<number> {
  const since = new Date(Date.now() - RECENT_ERROR_WINDOW_MS);
  const [row] = await db
    .select({ value: count() })
    .from(adminErrorEvents)
    .where(gte(adminErrorEvents.lastSeen, since));

  return row?.value ?? 0;
}
