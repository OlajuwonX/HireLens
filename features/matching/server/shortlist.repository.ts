import "server-only";

import { and, desc, eq, gte, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobMatches, jobPostings } from "@/lib/db/schema";
import { SHORTLIST_MIN_SCORE, SHORTLIST_SIZE } from "@/lib/matching/rank";
import { MATCHING_LIMITS } from "../constants";

const matchShape = {
  publicId: jobMatches.publicId,
  postingPublicId: jobPostings.publicId,
  title: jobPostings.title,
  company: jobPostings.company,
  location: jobPostings.location,
  workArrangement: jobPostings.workArrangement,
  verdict: jobMatches.verdict,
  reasons: jobMatches.reasons,
  score: jobMatches.score,
  rank: jobMatches.rank,
  fit: jobMatches.fit,
  insight: jobMatches.insight,
};

function activeFor(userId: string) {
  return and(
    eq(jobMatches.userId, userId),
    isNull(jobMatches.dismissedAt),
    isNull(jobPostings.expiredAt),
  );
}

export async function listShortlist(userId: string) {
  return db
    .select(matchShape)
    .from(jobMatches)
    .innerJoin(jobPostings, eq(jobPostings.id, jobMatches.postingId))
    .where(and(activeFor(userId), ne(jobMatches.verdict, "FAIL"), gte(jobMatches.rank, SHORTLIST_MIN_SCORE)))
    .orderBy(desc(jobMatches.rank))
    .limit(SHORTLIST_SIZE);
}

export async function listScreenedOut(userId: string) {
  return db
    .select(matchShape)
    .from(jobMatches)
    .innerJoin(jobPostings, eq(jobPostings.id, jobMatches.postingId))
    .where(and(activeFor(userId), eq(jobMatches.verdict, "FAIL")))
    .orderBy(desc(jobMatches.updatedAt))
    .limit(MATCHING_LIMITS.hiddenListSize);
}

export type MatchRow = Awaited<ReturnType<typeof listShortlist>>[number];
