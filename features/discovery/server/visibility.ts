import "server-only";

import { and, eq, gte, isNotNull, sql, type SQL } from "drizzle-orm";
import { jobBoardFollows, jobBoards, jobPostings } from "@/lib/db/schema";
import type { RoleMatcher } from "@/lib/discovery/role-match";
import { titleMatchesSql } from "./role-sql";

export type Audience = { userId: string; matcher: RoleMatcher };

export function followedBy(userId: string) {
  return and(eq(jobBoardFollows.boardId, jobPostings.boardId), eq(jobBoardFollows.userId, userId));
}

export function visibleTo(audience: Audience): SQL {
  return sql`(${isNotNull(jobBoardFollows.id)} or (${eq(jobBoards.system, true)} and ${titleMatchesSql(audience.matcher, jobPostings.title)}))`;
}

export function notHiddenDuplicate(userId: string): SQL {
  return sql`not exists (
    select 1 from ${jobPostings} canonical
    join ${jobBoards} canonical_board on canonical_board.id = canonical.board_id
    where canonical.id = ${jobPostings.duplicateOfId}
      and canonical.expired_at is null
      and (canonical_board.system or exists (
        select 1 from ${jobBoardFollows} follow
        where follow.board_id = canonical_board.id and follow.user_id = ${userId}
      ))
  )`;
}

export function freshSince(days: number) {
  return gte(jobPostings.sortAt, new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

export function audienceConditions(audience: Audience, days: number) {
  return and(visibleTo(audience), notHiddenDuplicate(audience.userId), freshSince(days));
}
