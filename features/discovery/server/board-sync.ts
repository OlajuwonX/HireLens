import "server-only";

import { fetchJson as defaultFetchJson, BoardFetchError } from "@/lib/discovery/http";
import { dedupeKey } from "@/lib/discovery/normalize";
import { adapters } from "@/lib/discovery/sources";
import type { BoardSnapshot, DiscoverySource, FetchJson } from "@/lib/discovery/types";
import type { JobBoard, NewJobPosting } from "@/lib/db/schema";
import { markBoardFetched } from "./board.repository";
import {
  countActivePostings,
  expireMissing,
  findCanonicalIds,
  upsertPostings,
} from "./posting.repository";

export type SyncResult = { ok: true; active: number } | { ok: false; error: string };

export async function fetchSnapshot(
  ref: { source: DiscoverySource; token: string },
  fetchJson: FetchJson = defaultFetchJson,
): Promise<BoardSnapshot> {
  return adapters[ref.source].fetchBoard(ref.token, fetchJson);
}

export function toPostingValues(input: {
  boardId: string;
  snapshot: BoardSnapshot;
  seenAt: Date;
  canonical: Map<string, string>;
}): NewJobPosting[] {
  return input.snapshot.postings.map((posting) => {
    const key = dedupeKey(posting);

    return {
      ...posting,
      boardId: input.boardId,
      dedupeKey: key,
      duplicateOfId: input.canonical.get(key) ?? null,
      sortAt: posting.postedAt ?? input.seenAt,
      lastSeenAt: input.seenAt,
      updatedAt: input.seenAt,
    };
  });
}

export async function storeSnapshot(board: Pick<JobBoard, "id">, snapshot: BoardSnapshot) {
  const seenAt = new Date();
  const keys = [...new Set(snapshot.postings.map((posting) => dedupeKey(posting)))];
  const canonical = await findCanonicalIds({ boardId: board.id, keys });

  await upsertPostings(toPostingValues({ boardId: board.id, snapshot, seenAt, canonical }));
  await expireMissing({ boardId: board.id, seenAt });

  const active = await countActivePostings(board.id);
  await markBoardFetched({ boardId: board.id, postingCount: active, error: null });

  return active;
}

export async function syncBoard(
  board: Pick<JobBoard, "id" | "source" | "token">,
  fetchJson?: FetchJson,
): Promise<SyncResult> {
  try {
    const snapshot = await fetchSnapshot(
      { source: board.source as DiscoverySource, token: board.token },
      fetchJson,
    );

    return { ok: true, active: await storeSnapshot(board, snapshot) };
  } catch (error) {
    const message =
      error instanceof BoardFetchError ? error.message : "The board could not be synced";

    await markBoardFetched({ boardId: board.id, error: message });

    return { ok: false, error: message };
  }
}
