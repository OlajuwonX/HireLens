import "server-only";

import { and, desc, eq, ilike, isNull, lt, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications, jobBoardFollows, jobBoards, jobPostings, jobs } from "@/lib/db/schema";
import { likePattern } from "@/lib/search/query";
import type { FeedCursor } from "../feed-cursor";
import { DISCOVERY_LIMITS } from "../constants";
import type { FeedFilters } from "../schemas/discovery.schema";
import { audienceConditions, followedBy, visibleTo, type Audience } from "./visibility";

const listShape = {
  publicId: jobPostings.publicId,
  title: jobPostings.title,
  company: jobPostings.company,
  location: jobPostings.location,
  workArrangement: jobPostings.workArrangement,
  employmentType: jobPostings.employmentType,
  salaryMin: jobPostings.salaryMin,
  salaryMax: jobPostings.salaryMax,
  currency: jobPostings.currency,
  postedAt: jobPostings.postedAt,
  sortAt: jobPostings.sortAt,
  source: jobBoards.source,
};

export type PostingListRow = {
  publicId: string;
  title: string;
  company: string;
  location: string | null;
  workArrangement: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  postedAt: Date | null;
  sortAt: Date;
  source: string;
};

export async function listFeed(input: {
  audience: Audience;
  filters: FeedFilters;
  cursor: FeedCursor | null;
  limit: number;
}): Promise<PostingListRow[]> {
  const conditions: (SQL | undefined)[] = [
    isNull(jobPostings.expiredAt),
    audienceConditions(input.audience, DISCOVERY_LIMITS.freshDays),
  ];

  if (input.filters.q) {
    const pattern = likePattern(input.filters.q);
    conditions.push(or(ilike(jobPostings.title, pattern), ilike(jobPostings.company, pattern)));
  }

  if (input.filters.arrangement) {
    conditions.push(eq(jobPostings.workArrangement, input.filters.arrangement));
  }

  if (input.cursor) {
    conditions.push(
      or(
        lt(jobPostings.sortAt, input.cursor.sortAt),
        and(eq(jobPostings.sortAt, input.cursor.sortAt), lt(jobPostings.publicId, input.cursor.publicId)),
      ),
    );
  }

  return db
    .select(listShape)
    .from(jobPostings)
    .innerJoin(jobBoards, eq(jobBoards.id, jobPostings.boardId))
    .leftJoin(jobBoardFollows, followedBy(input.audience.userId))
    .where(and(...conditions))
    .orderBy(desc(jobPostings.sortAt), desc(jobPostings.publicId))
    .limit(input.limit);
}

export async function findPostingForUser(input: { audience: Audience; publicId: string }) {
  const [row] = await db
    .select({ posting: jobPostings, source: jobBoards.source })
    .from(jobPostings)
    .innerJoin(jobBoards, eq(jobBoards.id, jobPostings.boardId))
    .leftJoin(jobBoardFollows, followedBy(input.audience.userId))
    .where(and(eq(jobPostings.publicId, input.publicId), visibleTo(input.audience)))
    .limit(1);

  return row ? { ...row.posting, source: row.source } : null;
}

export type PostingDetail = NonNullable<Awaited<ReturnType<typeof findPostingForUser>>>;

export type SavedJobRef = {
  applicationPublicId: string;
  sourceUrl: string | null;
  company: string;
  title: string;
};

export async function listSavedJobRefs(userId: string): Promise<SavedJobRef[]> {
  return db
    .select({
      applicationPublicId: applications.publicId,
      sourceUrl: jobs.sourceUrl,
      company: jobs.company,
      title: jobs.title,
    })
    .from(jobs)
    .innerJoin(applications, eq(applications.jobId, jobs.id))
    .where(eq(jobs.userId, userId))
    .limit(2_000);
}
