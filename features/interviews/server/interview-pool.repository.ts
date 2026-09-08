import "server-only";

import { and, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  interviewQuestionPools,
  userInterviewCycles,
  type InterviewQuestionPool,
} from "@/lib/db/schema";
import { INTERVIEW_POOL_PENDING_TTL_MS } from "../constants";

function isUniqueViolation(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function expireStalePendingPools() {
  const cutoff = new Date(Date.now() - INTERVIEW_POOL_PENDING_TTL_MS);

  await db
    .update(interviewQuestionPools)
    .set({
      status: "FAILED",
      failureReason: "StalePendingGeneration",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(interviewQuestionPools.status, "PENDING"),
        lt(interviewQuestionPools.createdAt, cutoff),
      ),
    );
}

export async function listReadyPoolsByFingerprint(fingerprint: string) {
  return db
    .select()
    .from(interviewQuestionPools)
    .where(
      and(
        eq(interviewQuestionPools.fingerprint, fingerprint),
        eq(interviewQuestionPools.status, "READY"),
      ),
    )
    .orderBy(interviewQuestionPools.poolVersion);
}

export async function findPendingPoolByFingerprint(fingerprint: string) {
  const [pool] = await db
    .select()
    .from(interviewQuestionPools)
    .where(
      and(
        eq(interviewQuestionPools.fingerprint, fingerprint),
        eq(interviewQuestionPools.status, "PENDING"),
      ),
    )
    .limit(1);

  return pool ?? null;
}

export async function listUserPoolIdsAmong(input: {
  userId: string;
  poolIds: string[];
}) {
  if (input.poolIds.length === 0) {
    return new Set<string>();
  }

  const rows = await db
    .select({ poolId: userInterviewCycles.poolId })
    .from(userInterviewCycles)
    .where(
      and(
        eq(userInterviewCycles.userId, input.userId),
        inArray(userInterviewCycles.poolId, input.poolIds),
      ),
    );

  return new Set(rows.map((row) => row.poolId));
}

async function nextPoolVersion(fingerprint: string) {
  const rows = await db
    .select({ poolVersion: interviewQuestionPools.poolVersion })
    .from(interviewQuestionPools)
    .where(eq(interviewQuestionPools.fingerprint, fingerprint));

  return rows.reduce((max, row) => Math.max(max, row.poolVersion), 0) + 1;
}

export type ClaimPoolInput = {
  fingerprint: string;
  roleFamily: string;
  seniorityBand: string;
  coreSkills: string[];
  promptVersion: string;
};

export async function claimPendingPool(
  input: ClaimPoolInput,
): Promise<
  { claimed: true; pool: InterviewQuestionPool } | { claimed: false }
> {
  try {
    const [pool] = await db
      .insert(interviewQuestionPools)
      .values({
        fingerprint: input.fingerprint,
        roleFamily: input.roleFamily,
        seniorityBand: input.seniorityBand,
        coreSkills: input.coreSkills,
        promptVersion: input.promptVersion,
        poolVersion: await nextPoolVersion(input.fingerprint),
        status: "PENDING",
      })
      .returning();

    return { claimed: true, pool };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { claimed: false };
    }

    throw error;
  }
}

export async function markPoolReady(input: {
  poolId: string;
  provider: string;
  model: string;
  questionCount: number;
  generationDurationMs: number;
}) {
  const [pool] = await db
    .update(interviewQuestionPools)
    .set({
      status: "READY",
      provider: input.provider,
      model: input.model,
      questionCount: input.questionCount,
      generationDurationMs: input.generationDurationMs,
      failureReason: null,
      updatedAt: new Date(),
    })
    .where(eq(interviewQuestionPools.id, input.poolId))
    .returning();

  return pool ?? null;
}

export async function markPoolFailed(input: {
  poolId: string;
  failureReason: string;
}) {
  await db
    .update(interviewQuestionPools)
    .set({
      status: "FAILED",
      failureReason: input.failureReason.slice(0, 500),
      updatedAt: new Date(),
    })
    .where(eq(interviewQuestionPools.id, input.poolId));
}
