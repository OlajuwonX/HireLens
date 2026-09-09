import "server-only";

import type { InterviewQuestionPool } from "@/lib/db/schema";
import { INTERVIEW_POOL_PROMPT_VERSION } from "../constants";
import type { InterviewProfile } from "../interview-profile";
import {
  claimPendingPool,
  expireStalePendingPools,
  listReadyPoolsByFingerprint,
  listUserPoolIdsAmong,
} from "./interview-pool.repository";

export type PoolResolution =
  | { status: "reuse"; pool: InterviewQuestionPool; recycled: boolean }
  | { status: "generate"; pool: InterviewQuestionPool }
  | { status: "pending" };

export async function resolveInterviewPool(input: {
  userId: string;
  fingerprint: string;
  profile: InterviewProfile;
}): Promise<PoolResolution> {
  await expireStalePendingPools();

  const readyPools = await listReadyPoolsByFingerprint(input.fingerprint);

  if (readyPools.length > 0) {
    const usedPoolIds = await listUserPoolIdsAmong({
      userId: input.userId,
      poolIds: readyPools.map((pool) => pool.id),
    });

    const unused = readyPools.find((pool) => !usedPoolIds.has(pool.id));

    if (unused) {
      return { status: "reuse", pool: unused, recycled: false };
    }
  }

  const claim = await claimPendingPool({
    fingerprint: input.fingerprint,
    roleFamily: input.profile.roleFamily,
    seniorityBand: input.profile.seniorityBand,
    coreSkills: input.profile.coreSkills,
    promptVersion: INTERVIEW_POOL_PROMPT_VERSION,
  });

  if (claim.claimed) {
    return { status: "generate", pool: claim.pool };
  }

  if (readyPools.length > 0) {
    return { status: "reuse", pool: readyPools[0], recycled: true };
  }

  return { status: "pending" };
}
