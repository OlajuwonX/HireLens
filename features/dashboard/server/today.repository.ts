import "server-only";

import { and, asc, count, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications, applicationTasks, emailEvents, jobMatches, jobs } from "@/lib/db/schema";
import { SHORTLIST_MIN_SCORE } from "@/lib/matching/rank";
import { POSITIVE_KINDS } from "@/lib/responses/classify";
import type { TodaySignals } from "../today-items";

const DAY = 86_400_000;

async function total(query: Promise<{ value: number }[]>) {
  const [row] = await query;

  return row?.value ?? 0;
}

function countTasks(userId: string, states: string[]) {
  return total(
    db
      .select({ value: count() })
      .from(applicationTasks)
      .where(and(eq(applicationTasks.userId, userId), inArray(applicationTasks.state, states))),
  );
}

export async function readTodaySignals(userId: string, now = new Date()): Promise<TodaySignals> {
  const [toApprove, needsYou, toReview, goodReplies, followUpsDue, newMatches, interviews] = await Promise.all([
    countTasks(userId, ["READY_FOR_REVIEW"]),
    countTasks(userId, ["NEEDS_INPUT", "NEEDS_MANUAL_ACTION"]),
    total(
      db
        .select({ value: count() })
        .from(emailEvents)
        .where(and(eq(emailEvents.userId, userId), eq(emailEvents.status, "NEEDS_REVIEW"))),
    ),
    total(
      db
        .select({ value: count() })
        .from(emailEvents)
        .where(
          and(
            eq(emailEvents.userId, userId),
            eq(emailEvents.status, "AUTO"),
            inArray(emailEvents.kind, POSITIVE_KINDS),
            gte(emailEvents.receivedAt, new Date(now.getTime() - 7 * DAY)),
          ),
        ),
    ),
    total(
      db
        .select({ value: count() })
        .from(applications)
        .where(
          and(
            eq(applications.userId, userId),
            isNull(applications.archivedAt),
            inArray(applications.status, ["PENDING", "SHORTLISTED"]),
            lte(applications.followUpAt, now),
          ),
        ),
    ),
    total(
      db
        .select({ value: count() })
        .from(jobMatches)
        .where(
          and(
            eq(jobMatches.userId, userId),
            isNull(jobMatches.dismissedAt),
            gte(jobMatches.rank, SHORTLIST_MIN_SCORE),
            gte(jobMatches.scoredAt, new Date(now.getTime() - 2 * DAY)),
          ),
        ),
    ),
    db
      .select({ publicId: applications.publicId, company: jobs.company, at: applications.interviewAt })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(
        and(
          eq(applications.userId, userId),
          isNull(applications.archivedAt),
          gte(applications.interviewAt, new Date(now.getTime() - 2 * 3_600_000)),
          lte(applications.interviewAt, new Date(now.getTime() + 7 * DAY)),
        ),
      )
      .orderBy(asc(applications.interviewAt))
      .limit(3),
  ]);

  return {
    toApprove,
    needsYou,
    toReview,
    goodReplies,
    followUpsDue,
    newMatches,
    interviews: interviews.flatMap((row) => (row.at ? [{ publicId: row.publicId, company: row.company, at: row.at }] : [])),
  };
}
