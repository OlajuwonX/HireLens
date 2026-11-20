import "server-only";

import { fetchJson as defaultFetchJson, BoardFetchError } from "@/lib/discovery/http";
import { dedupeKey } from "@/lib/discovery/normalize";
import { adapters } from "@/lib/discovery/sources";
import { titleMatches, type RoleMatcher } from "@/lib/discovery/role-match";
import type { BoardSnapshot, CatalogSource, FetchJson } from "@/lib/discovery/types";
import type { JobBoard, NewJobPosting } from "@/lib/db/schema";
import { markBoardFetched } from "./board.repository";
import {
  countActivePostings,
  expireMissing,
  recanonicalize,
  upsertPostings,
} from "./posting.repository";

export type SyncResult = { ok: true; active: number } | { ok: false; error: string };

export async function fetchSnapshot(
  ref: { source: CatalogSource; token: string },
  fetchJson: FetchJson = defaultFetchJson,
): Promise<BoardSnapshot> {
  return adapters[ref.source].fetchBoard(ref.token, fetchJson);
}

export function toPostingValues(input: {
  boardId: string;
  snapshot: BoardSnapshot;
  seenAt: Date;
}): NewJobPosting[] {
  return input.snapshot.postings.map((posting) => ({
    ...posting,
    boardId: input.boardId,
    dedupeKey: dedupeKey(posting),
    sortAt: posting.postedAt ?? input.seenAt,
    lastSeenAt: input.seenAt,
    updatedAt: input.seenAt,
  }));
}

export function relevantSnapshot(snapshot: BoardSnapshot, matcher: RoleMatcher | null): BoardSnapshot {
  return matcher ? { ...snapshot, postings: snapshot.postings.filter((posting) => titleMatches(matcher, posting.title)) } : snapshot;
}

export async function storeSnapshot(
  board: Pick<JobBoard, "id">,
  fetched: BoardSnapshot,
  matcher: RoleMatcher | null = null,
) {
  const seenAt = new Date();
  const snapshot = relevantSnapshot(fetched, matcher);
  const keys = [...new Set(snapshot.postings.map((posting) => dedupeKey(posting)))];

  await upsertPostings(toPostingValues({ boardId: board.id, snapshot, seenAt }));
  const expiredKeys = await expireMissing({ boardId: board.id, seenAt });
  await recanonicalize([...new Set([...keys, ...expiredKeys])]);

  const active = await countActivePostings(board.id);
  await markBoardFetched({ boardId: board.id, postingCount: active, error: null });

  return active;
}

export async function syncBoard(
  board: Pick<JobBoard, "id" | "source" | "token">,
  fetchJson?: FetchJson,
  matcher: RoleMatcher | null = null,
): Promise<SyncResult> {
  try {
    const snapshot = await fetchSnapshot(
      { source: board.source as CatalogSource, token: board.token },
      fetchJson,
    );

    return { ok: true, active: await storeSnapshot(board, snapshot, matcher) };
  } catch (error) {
    const message =
      error instanceof BoardFetchError ? error.message : "The board could not be synced";

    await markBoardFetched({ boardId: board.id, error: message });

    return { ok: false, error: message };
  }
}
