import "server-only";

import { and, asc, count, desc, eq, inArray, isNull, notExists, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobBoardFollows, jobBoards, jobPostings } from "@/lib/db/schema";
import { DISCOVERY_SOURCES } from "@/lib/discovery/types";
import { DISCOVERY_LIMITS } from "../constants";
import { titleMatchesSql } from "./role-sql";
import { freshSince, inRegions, type Audience } from "./visibility";

export async function listSuggestedBoards(input: { audience: Audience; limit: number }) {
  if (input.audience.matcher.length === 0) {
    return [];
  }

  const openRoles = count(jobPostings.id);
  const followed = db
    .select({ one: sql`1` })
    .from(jobBoardFollows)
    .where(and(eq(jobBoardFollows.boardId, jobBoards.id), eq(jobBoardFollows.userId, input.audience.userId)));

  return db
    .select({
      publicId: jobBoards.publicId,
      companyName: jobBoards.companyName,
      source: jobBoards.source,
      region: jobBoards.region,
      openRoles,
    })
    .from(jobBoards)
    .innerJoin(
      jobPostings,
      and(
        eq(jobPostings.boardId, jobBoards.id),
        isNull(jobPostings.expiredAt),
        freshSince(DISCOVERY_LIMITS.freshDays),
        titleMatchesSql(input.audience.matcher, jobPostings.title),
      ),
    )
    .where(
      and(
        eq(jobBoards.system, true),
        inArray(jobBoards.source, [...DISCOVERY_SOURCES]),
        inRegions(input.audience.regions),
        notExists(followed),
      ),
    )
    .groupBy(jobBoards.id)
    .orderBy(desc(openRoles), asc(jobBoards.companyName))
    .limit(input.limit);
}

export type SuggestedBoard = Awaited<ReturnType<typeof listSuggestedBoards>>[number];

export async function findSuggestableBoard(publicId: string) {
  const [board] = await db
    .select({ id: jobBoards.id, companyName: jobBoards.companyName, postingCount: jobBoards.postingCount })
    .from(jobBoards)
    .where(
      and(
        eq(jobBoards.publicId, publicId),
        eq(jobBoards.system, true),
        inArray(jobBoards.source, [...DISCOVERY_SOURCES]),
      ),
    )
    .limit(1);

  return board ?? null;
}

export async function findBoardByPublicId(publicId: string) {
  const [board] = await db
    .select({ id: jobBoards.id, companyName: jobBoards.companyName })
    .from(jobBoards)
    .where(eq(jobBoards.publicId, publicId))
    .limit(1);

  return board ?? null;
}
