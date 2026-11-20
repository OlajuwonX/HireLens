import "server-only";

import { BoardFetchError } from "@/lib/discovery/http";
import { parseBoardInput } from "@/lib/discovery/sources";
import type { DiscoverySource } from "@/lib/discovery/types";
import { DISCOVERY_LIMITS, sourceLabels } from "../constants";
import { listAllTargetRoles } from "@/features/candidate-profile/server/profile.repository";
import { SYSTEM_BOARDS } from "@/lib/discovery/catalog";
import { buildRoleMatcher } from "@/lib/discovery/role-match";
import {
  countFollows,
  findBoard,
  followBoard,
  listDueBoards,
  seedSystemBoards,
  upsertBoard,
} from "./board.repository";
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

type RunOptions = {
  limit: number;
  budgetMs: number;
  staleBefore?: Date;
  now?: () => number;
};

async function syncDueBoards(options: RunOptions) {
  const now = options.now ?? Date.now;
  const startedAt = now();

  await seedSystemBoards(SYSTEM_BOARDS);

  const [boards, roles] = await Promise.all([
    listDueBoards({ limit: options.limit, staleBefore: options.staleBefore }),
    listAllTargetRoles(),
  ]);
  const matcher = buildRoleMatcher(roles);
  const report = { boards: boards.length, synced: 0, failed: 0, skipped: 0, purged: 0 };
  const queue = [...boards];

  const work = async () => {
    for (let board = queue.shift(); board; board = queue.shift()) {
      if (now() - startedAt > options.budgetMs) {
        report.skipped += 1;
        continue;
      }

      const result = await syncBoard(board, undefined, board.system && !board.followed ? matcher : null);
      report[result.ok ? "synced" : "failed"] += 1;
    }
  };

  await Promise.all(Array.from({ length: DISCOVERY_LIMITS.concurrency }, work));

  return { report, startedAt };
}

export async function runDailyDiscovery(input: { now?: () => number } = {}) {
  const { report, startedAt } = await syncDueBoards({
    limit: DISCOVERY_LIMITS.boardsPerRun,
    budgetMs: DISCOVERY_LIMITS.runBudgetMs,
    now: input.now,
  });
  const retentionMs = DISCOVERY_LIMITS.expiredRetentionDays * 24 * 60 * 60 * 1000;

  report.purged = await purgeExpiredPostings(new Date(startedAt - retentionMs));

  return report;
}

export async function refreshDiscovery(input: { now?: () => number } = {}) {
  const staleMs = DISCOVERY_LIMITS.refreshStaleHours * 60 * 60 * 1000;
  const { report } = await syncDueBoards({
    limit: DISCOVERY_LIMITS.refreshBoards,
    budgetMs: DISCOVERY_LIMITS.refreshBudgetMs,
    staleBefore: new Date((input.now ?? Date.now)() - staleMs),
    now: input.now,
  });

  return report;
}
