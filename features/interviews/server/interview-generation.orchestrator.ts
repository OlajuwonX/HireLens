import "server-only";

import type { InterviewQuestionPool } from "@/lib/db/schema";
import {
  completeUsage,
  failUsage,
  reserveUsage,
} from "@/features/usage/server/ai-usage.service";
import type { UsageDenialReason } from "@/features/usage/limit-notice";
import {
  getInterviewEligibility,
  type InterviewEligibility,
} from "./interview-eligibility.service";
import { getInterviewProfile } from "./interview-profile.service";
import { markPoolFailed } from "./interview-pool.repository";
import { resolveInterviewPool } from "./interview-pool-cache.service";
import { generatePoolForClaim } from "./interview-pool-generation.service";
import { recordInterviewEvent } from "./interview-observability";

const USAGE_ACTION = "INTERVIEW_POOL_GENERATION" as const;

export type EnsureInterviewPoolResult =
  | { status: "ineligible"; eligibility: InterviewEligibility }
  | { status: "no_source" }
  | { status: "ready"; pool: InterviewQuestionPool; reused: boolean }
  | { status: "pending" }
  | { status: "quota_blocked"; reason: UsageDenialReason }
  | { status: "failed"; reason: string };

async function settle(work: Promise<unknown>, stage: string) {
  try {
    await work;
  } catch (error) {
    console.error("interview usage bookkeeping failed", {
      stage,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function ensureInterviewPool(input: {
  userId: string;
}): Promise<EnsureInterviewPoolResult> {
  const eligibility = await getInterviewEligibility(input.userId);

  if (!eligibility.eligible) {
    return { status: "ineligible", eligibility };
  }

  const resolvedProfile = await getInterviewProfile(input.userId);

  if (!resolvedProfile) {
    return { status: "no_source" };
  }

  const { profile, fingerprint } = resolvedProfile;
  const base = {
    fingerprint,
    roleFamily: profile.roleFamily,
    seniorityBand: profile.seniorityBand,
  };

  const resolution = await resolveInterviewPool({
    userId: input.userId,
    fingerprint,
    profile,
  });

  if (resolution.status === "reuse") {
    recordInterviewEvent("cache_hit", {
      ...base,
      poolId: resolution.pool.id,
      poolVersion: resolution.pool.poolVersion,
      recycled: resolution.recycled,
    });
    recordInterviewEvent("questions_reused", {
      poolId: resolution.pool.id,
      questionCount: resolution.pool.questionCount,
    });

    return { status: "ready", pool: resolution.pool, reused: true };
  }

  if (resolution.status === "pending") {
    recordInterviewEvent("cache_miss", { ...base, outcome: "pending" });

    return { status: "pending" };
  }

  const pool = resolution.pool;

  recordInterviewEvent("cache_miss", {
    ...base,
    poolId: pool.id,
    poolVersion: pool.poolVersion,
  });

  const reservation = await reserveUsage({
    userId: input.userId,
    action: USAGE_ACTION,
  });

  if (!reservation.ok) {
    await markPoolFailed({
      poolId: pool.id,
      failureReason: `QuotaRefused:${reservation.reason}`,
    });
    recordInterviewEvent("quota_refusal", {
      ...base,
      userId: input.userId,
      reason: reservation.reason,
    });

    return { status: "quota_blocked", reason: reservation.reason };
  }

  const result = await generatePoolForClaim({ pool, profile });

  if (!result.ok) {
    await settle(
      failUsage({
        userId: input.userId,
        reservationId: reservation.reservationId,
        action: USAGE_ACTION,
        inputHash: fingerprint,
        failureReason: result.reason,
      }),
      "fail",
    );
    recordInterviewEvent("generation_failure", {
      ...base,
      poolId: pool.id,
      reason: result.reason,
    });

    return { status: "failed", reason: result.reason };
  }

  await settle(
    completeUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: USAGE_ACTION,
      provider: result.provider,
      model: result.model,
      inputHash: fingerprint,
    }),
    "complete",
  );
  recordInterviewEvent("pool_generated", {
    ...base,
    poolId: pool.id,
    poolVersion: pool.poolVersion,
    questionCount: result.questionCount,
    provider: result.provider,
    model: result.model,
  });
  recordInterviewEvent("provider_used", {
    provider: result.provider,
    model: result.model,
  });

  return { status: "ready", pool, reused: false };
}
