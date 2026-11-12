import "server-only";

import { and, asc, count, eq, exists, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobBoardFollows, jobBoards } from "@/lib/db/schema";
import type { DiscoverySource } from "@/lib/discovery/types";

export async function findBoard(input: { source: DiscoverySource; token: string }) {
  const [board] = await db
    .select()
    .from(jobBoards)
    .where(and(eq(jobBoards.source, input.source), eq(jobBoards.token, input.token)))
    .limit(1);

  return board ?? null;
}

export async function upsertBoard(input: {
  source: DiscoverySource;
  token: string;
  companyName: string;
}) {
  const [board] = await db
    .insert(jobBoards)
    .values(input)
    .onConflictDoUpdate({
      target: [jobBoards.source, jobBoards.token],
      set: { companyName: input.companyName, updatedAt: new Date() },
    })
    .returning();

  return board;
}

export async function markBoardFetched(input: {
  boardId: string;
  postingCount?: number;
  error: string | null;
}) {
  await db
    .update(jobBoards)
    .set({
      lastFetchedAt: new Date(),
      lastError: input.error,
      ...(input.postingCount === undefined ? {} : { postingCount: input.postingCount }),
      updatedAt: new Date(),
    })
    .where(eq(jobBoards.id, input.boardId));
}

export async function followBoard(input: { userId: string; boardId: string }) {
  await db.insert(jobBoardFollows).values(input).onConflictDoNothing();
}

export async function unfollowBoard(input: { userId: string; publicId: string }) {
  const [board] = await db
    .select({ id: jobBoards.id })
    .from(jobBoards)
    .where(eq(jobBoards.publicId, input.publicId))
    .limit(1);

  if (!board) {
    return false;
  }

  const removed = await db
    .delete(jobBoardFollows)
    .where(and(eq(jobBoardFollows.userId, input.userId), eq(jobBoardFollows.boardId, board.id)))
    .returning({ id: jobBoardFollows.id });

  return removed.length > 0;
}

export async function countFollows(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(jobBoardFollows)
    .where(eq(jobBoardFollows.userId, userId));

  return row?.value ?? 0;
}

export async function listFollowedBoards(userId: string) {
  return db
    .select({
      publicId: jobBoards.publicId,
      source: jobBoards.source,
      token: jobBoards.token,
      companyName: jobBoards.companyName,
      postingCount: jobBoards.postingCount,
      lastFetchedAt: jobBoards.lastFetchedAt,
      lastError: jobBoards.lastError,
    })
    .from(jobBoardFollows)
    .innerJoin(jobBoards, eq(jobBoards.id, jobBoardFollows.boardId))
    .where(eq(jobBoardFollows.userId, userId))
    .orderBy(asc(jobBoards.companyName));
}

export type FollowedBoard = Awaited<ReturnType<typeof listFollowedBoards>>[number];

export async function listDueBoards(limit: number) {
  return db
    .select()
    .from(jobBoards)
    .where(
      exists(
        db
          .select({ one: sql`1` })
          .from(jobBoardFollows)
          .where(eq(jobBoardFollows.boardId, jobBoards.id)),
      ),
    )
    .orderBy(sql`${jobBoards.lastFetchedAt} asc nulls first`)
    .limit(limit);
}
