import "server-only";

import { and, count, eq, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobPostings, type NewJobPosting } from "@/lib/db/schema";
import { DISCOVERY_LIMITS } from "../constants";

const excluded = (column: string) => sql.raw(`excluded."${column}"`);

export async function findCanonicalIds(input: { boardId: string; keys: string[] }) {
  if (input.keys.length === 0) {
    return new Map<string, string>();
  }

  const rows = await db
    .select({ id: jobPostings.id, dedupeKey: jobPostings.dedupeKey })
    .from(jobPostings)
    .where(
      and(
        inArray(jobPostings.dedupeKey, input.keys),
        ne(jobPostings.boardId, input.boardId),
        isNull(jobPostings.expiredAt),
        isNull(jobPostings.duplicateOfId),
      ),
    );

  return new Map(rows.map((row) => [row.dedupeKey, row.id]));
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
  await db
    .update(jobPostings)
    .set({ expiredAt: input.seenAt, updatedAt: input.seenAt })
    .where(
      and(
        eq(jobPostings.boardId, input.boardId),
        isNull(jobPostings.expiredAt),
        lt(jobPostings.lastSeenAt, input.seenAt),
      ),
    );
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
