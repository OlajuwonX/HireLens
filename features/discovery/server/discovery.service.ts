import "server-only";

import { BoardFetchError } from "@/lib/discovery/http";
import { parseBoardInput } from "@/lib/discovery/sources";
import type { DiscoverySource } from "@/lib/discovery/types";
import { DISCOVERY_LIMITS, sourceLabels } from "../constants";
import { countFollows, findBoard, followBoard, listDueBoards, upsertBoard } from "./board.repository";
import { fetchSnapshot, storeSnapshot, syncBoard } from "./board-sync";
import { purgeExpiredPostings } from "./posting.repository";

export type FollowResult =
  | { ok: true; companyName: string; active: number }
  | { ok: false; message: string };

export async function followJobBoard(input: {
  userId: string;
  board: string;
  source?: DiscoverySource;
}): Promise<FollowResult> {
  const ref = parseBoardInput({ value: input.board, source: input.source });

  if (!ref) {
    return {
      ok: false,
      message: "Paste a Greenhouse, Lever or Ashby board link, or choose a source and enter the board name.",
    };
  }

  if ((await countFollows(input.userId)) >= DISCOVERY_LIMITS.followsPerUser) {
    return { ok: false, message: `You can follow up to ${DISCOVERY_LIMITS.followsPerUser} boards.` };
  }

  const known = await findBoard(ref);

  if (known) {
    await followBoard({ userId: input.userId, boardId: known.id });

    return { ok: true, companyName: known.companyName, active: known.postingCount };
  }

  try {
    const snapshot = await fetchSnapshot(ref);
    const board = await upsertBoard({ ...ref, companyName: snapshot.companyName });

    await followBoard({ userId: input.userId, boardId: board.id });

    return { ok: true, companyName: board.companyName, active: await storeSnapshot(board, snapshot) };
  } catch (error) {
    const missing = error instanceof BoardFetchError && error.notFound;

    return {
      ok: false,
      message: missing
        ? `No public ${sourceLabels[ref.source]} board called "${ref.token}" was found.`
        : "That board could not be reached right now. Try again later.",
    };
  }
}

export async function runDailyDiscovery(input: { now?: () => number } = {}) {
  const now = input.now ?? Date.now;
  const startedAt = now();
  const boards = await listDueBoards(DISCOVERY_LIMITS.boardsPerRun);
  const report = { boards: boards.length, synced: 0, failed: 0, skipped: 0, purged: 0 };

  for (const board of boards) {
    if (now() - startedAt > DISCOVERY_LIMITS.runBudgetMs) {
      report.skipped += 1;
      continue;
    }

    const result = await syncBoard(board);
    report[result.ok ? "synced" : "failed"] += 1;
  }

  const retentionMs = DISCOVERY_LIMITS.expiredRetentionDays * 24 * 60 * 60 * 1000;
  report.purged = await purgeExpiredPostings(new Date(startedAt - retentionMs));

  return report;
}
