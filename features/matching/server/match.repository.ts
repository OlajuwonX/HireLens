import "server-only";

import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobBoardFollows, jobMatches, jobPostings, type NewJobMatch } from "@/lib/db/schema";
import { MATCHING_LIMITS } from "../constants";

const excluded = (column: string) => sql.raw(`excluded."${column}"`);

export async function listPostingsToMatch(input: { userId: string; inputHash: string }) {
  return db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      company: jobPostings.company,
      location: jobPostings.location,
      workArrangement: jobPostings.workArrangement,
      description: sql<string>`left(${jobPostings.description}, ${MATCHING_LIMITS.scanDescriptionChars})`,
    })
    .from(jobPostings)
    .innerJoin(
      jobBoardFollows,
      and(eq(jobBoardFollows.boardId, jobPostings.boardId), eq(jobBoardFollows.userId, input.userId)),
    )
    .leftJoin(
      jobMatches,
      and(eq(jobMatches.postingId, jobPostings.id), eq(jobMatches.userId, input.userId)),
    )
    .where(
      and(
        isNull(jobPostings.expiredAt),
        isNull(jobPostings.duplicateOfId),
        isNull(jobMatches.dismissedAt),
        or(
          isNull(jobMatches.id),
          ne(jobMatches.inputHash, input.inputHash),
          and(ne(jobMatches.verdict, "FAIL"), isNull(jobMatches.score)),
        ),
      ),
    )
    .orderBy(desc(jobPostings.sortAt))
    .limit(MATCHING_LIMITS.scanSize);
}

export type PostingToMatch = Awaited<ReturnType<typeof listPostingsToMatch>>[number];

export async function upsertMatches(values: NewJobMatch[]) {
  if (values.length === 0) {
    return;
  }

  await db
    .insert(jobMatches)
    .values(values)
    .onConflictDoUpdate({
      target: [jobMatches.userId, jobMatches.postingId],
      set: {
        inputHash: excluded("input_hash"),
        verdict: excluded("verdict"),
        reasons: excluded("reasons"),
        score: excluded("score"),
        rank: excluded("rank"),
        fit: excluded("fit"),
        insight: excluded("insight"),
        scoredAt: excluded("scored_at"),
        updatedAt: excluded("updated_at"),
      },
    });
}

export async function dismissMatch(input: { userId: string; publicId: string }) {
  const updated = await db
    .update(jobMatches)
    .set({ dismissedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(jobMatches.userId, input.userId), eq(jobMatches.publicId, input.publicId)))
    .returning({ id: jobMatches.id });

  return updated.length > 0;
}
