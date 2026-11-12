import "server-only";

import { and, desc, eq, ilike, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobBoardFollows, jobBoards, jobPostings, jobs } from "@/lib/db/schema";
import { likePattern } from "@/lib/search/query";
import type { FeedCursor } from "../feed-cursor";
import type { FeedFilters } from "../schemas/discovery.schema";

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

function followedBy(userId: string) {
  return db
    .select()
    .from(jobPostings)
    .innerJoin(
      jobBoardFollows,
      and(eq(jobBoardFollows.boardId, jobPostings.boardId), eq(jobBoardFollows.userId, userId)),
    )
    .innerJoin(jobBoards, eq(jobBoards.id, jobPostings.boardId));
}

function hiddenDuplicate(userId: string) {
  return sql`exists (
    select 1 from ${jobPostings} canonical
    join ${jobBoardFollows} follow on follow.board_id = canonical.board_id
    where canonical.id = ${jobPostings.duplicateOfId} and follow.user_id = ${userId}
  )`;
}

export async function listFeed(input: {
  userId: string;
  filters: FeedFilters;
  cursor: FeedCursor | null;
  limit: number;
}): Promise<PostingListRow[]> {
  const conditions: SQL[] = [
    isNull(jobPostings.expiredAt),
    sql`not ${hiddenDuplicate(input.userId)}`,
  ];

  if (input.filters.q) {
    const pattern = likePattern(input.filters.q);
    conditions.push(or(ilike(jobPostings.title, pattern), ilike(jobPostings.company, pattern))!);
  }

  if (input.filters.arrangement) {
    conditions.push(eq(jobPostings.workArrangement, input.filters.arrangement));
  }

  if (input.cursor) {
    conditions.push(
      or(
        lt(jobPostings.sortAt, input.cursor.sortAt),
        and(eq(jobPostings.sortAt, input.cursor.sortAt), lt(jobPostings.publicId, input.cursor.publicId)),
      )!,
    );
  }

  return db
    .select(listShape)
    .from(jobPostings)
    .innerJoin(
      jobBoardFollows,
      and(eq(jobBoardFollows.boardId, jobPostings.boardId), eq(jobBoardFollows.userId, input.userId)),
    )
    .innerJoin(jobBoards, eq(jobBoards.id, jobPostings.boardId))
    .where(and(...conditions))
    .orderBy(desc(jobPostings.sortAt), desc(jobPostings.publicId))
    .limit(input.limit);
}

export async function findPostingForUser(input: { userId: string; publicId: string }) {
  const [row] = await followedBy(input.userId)
    .where(eq(jobPostings.publicId, input.publicId))
    .limit(1);

  return row ? { ...row.job_postings, source: row.job_boards.source } : null;
}

export type PostingDetail = NonNullable<Awaited<ReturnType<typeof findPostingForUser>>>;

export async function hasSavedJobWithUrl(input: { userId: string; url: string }) {
  const [row] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.userId, input.userId), eq(jobs.sourceUrl, input.url)))
    .limit(1);

  return Boolean(row);
}
