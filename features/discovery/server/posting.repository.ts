import "server-only";

import { and, count, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobBoards, jobPostings, type NewJobPosting } from "@/lib/db/schema";
import { DISCOVERY_SOURCES } from "@/lib/discovery/types";
import { DISCOVERY_LIMITS } from "../constants";

const excluded = (column: string) => sql.raw(`excluded."${column}"`);

export async function recanonicalize(keys: string[]) {
  if (keys.length === 0) {
    return;
  }

  await db.execute(sql`
    with ranked as (
      select
        p.id,
        p.board_id,
        first_value(p.id) over grouped as canonical_id,
        first_value(p.board_id) over grouped as canonical_board
      from ${jobPostings} p
      join ${jobBoards} b on b.id = p.board_id
      where p.expired_at is null and p.dedupe_key in ${keys}
      window grouped as (
        partition by p.dedupe_key
        order by case when b.source in ${[...DISCOVERY_SOURCES]} then 0 else 1 end, p.created_at, p.id
      )
    ),
    target as (
      select id, case when board_id = canonical_board then null else canonical_id end as duplicate_of
      from ranked
    )
    update ${jobPostings} p
    set duplicate_of_id = target.duplicate_of
    from target
    where p.id = target.id and p.duplicate_of_id is distinct from target.duplicate_of
  `);
}

export async function upsertPostings(values: NewJobPosting[]) {
  for (let start = 0; start < values.length; start += DISCOVERY_LIMITS.upsertChunk) {
    await db
      .insert(jobPostings)
      .values(values.slice(start, start + DISCOVERY_LIMITS.upsertChunk))
      .onConflictDoUpdate({
        target: [jobPostings.boardId, jobPostings.sourceId],
        set: {
          title: excluded("title"),
          company: excluded("company"),
          location: excluded("location"),
          workArrangement: excluded("work_arrangement"),
          employmentType: excluded("employment_type"),
          salaryMin: excluded("salary_min"),
          salaryMax: excluded("salary_max"),
          currency: excluded("currency"),
          description: excluded("description"),
          url: excluded("url"),
          applyUrl: excluded("apply_url"),
          postedAt: excluded("posted_at"),
          dedupeKey: excluded("dedupe_key"),
          lastSeenAt: excluded("last_seen_at"),
          expiredAt: sql`null`,
          updatedAt: excluded("updated_at"),
        },
      });
  }
}

export async function expireMissing(input: { boardId: string; seenAt: Date }) {
  const expired = await db
    .update(jobPostings)
    .set({ expiredAt: input.seenAt, updatedAt: input.seenAt })
    .where(
      and(
        eq(jobPostings.boardId, input.boardId),
        isNull(jobPostings.expiredAt),
        lt(jobPostings.lastSeenAt, input.seenAt),
      ),
    )
    .returning({ dedupeKey: jobPostings.dedupeKey });

  return expired.map((row) => row.dedupeKey);
}

export async function countActivePostings(boardId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(jobPostings)
    .where(and(eq(jobPostings.boardId, boardId), isNull(jobPostings.expiredAt)));

  return row?.value ?? 0;
}

export async function purgeExpiredPostings(before: Date) {
  const removed = await db
    .delete(jobPostings)
    .where(lt(jobPostings.expiredAt, before))
    .returning({ id: jobPostings.id });

  return removed.length;
}
