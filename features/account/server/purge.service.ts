import "server-only";

import * as Sentry from "@sentry/nextjs";
import { getStorageProvider } from "@/lib/storage/provider";
import type { StorageProvider } from "@/lib/storage/types";
import { PURGE_BATCH_SIZE, PURGE_WARNING_DAYS } from "../constants";
import { sendDeletionFinalWarningEmail } from "./account-email.service";
import {
  deletePurgeableAccount,
  isStillPurgeable,
  listAccountsNeedingPurgeWarning,
  listPurgeableAccounts,
  listStorageKeysForUser,
  markPurgeWarned,
} from "./purge.repository";

export type PurgeOutcome =
  | "PURGED"
  | "WOULD_PURGE"
  | "RESTORED_BEFORE_PURGE"
  | "STORAGE_FAILED"
  | "DATABASE_FAILED";

export type PurgeEntry = {
  userId: string;
  objectCount: number;
  outcome: PurgeOutcome;
};

export type PurgeReport = {
  dryRun: boolean;
  eligible: number;
  purged: number;
  failed: number;
  entries: PurgeEntry[];
};

async function deleteObjects(input: {
  storage: StorageProvider;
  keys: string[];
  userId: string;
}) {
  for (const storageKey of input.keys) {
    try {
      await input.storage.deleteFile(storageKey);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { source: "account-purge-storage" },
        extra: { userId: input.userId },
      });

      return false;
    }
  }

  return true;
}

export async function purgeExpiredAccounts(input: {
  dryRun: boolean;
  now?: Date;
  limit?: number;
  storageProvider?: StorageProvider;
}): Promise<PurgeReport> {
  const before = input.now ?? new Date();
  const limit = input.limit ?? PURGE_BATCH_SIZE;
  const candidates = await listPurgeableAccounts({ before, limit });
  const storage = input.storageProvider ?? getStorageProvider();
  const entries: PurgeEntry[] = [];

  for (const candidate of candidates) {
    const keys = (await listStorageKeysForUser(candidate.id)).map(
      (row) => row.storageKey,
    );

    if (input.dryRun) {
      entries.push({
        userId: candidate.id,
        objectCount: keys.length,
        outcome: "WOULD_PURGE",
      });
      continue;
    }

    if (!(await isStillPurgeable({ userId: candidate.id, before }))) {
      entries.push({
        userId: candidate.id,
        objectCount: keys.length,
        outcome: "RESTORED_BEFORE_PURGE",
      });
      continue;
    }

    const storageCleared = await deleteObjects({
      storage,
      keys,
      userId: candidate.id,
    });

    if (!storageCleared) {
      entries.push({
        userId: candidate.id,
        objectCount: keys.length,
        outcome: "STORAGE_FAILED",
      });
      continue;
    }

    try {
      const deleted = await deletePurgeableAccount({
        userId: candidate.id,
        before,
      });

      entries.push({
        userId: candidate.id,
        objectCount: keys.length,
        outcome: deleted ? "PURGED" : "RESTORED_BEFORE_PURGE",
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { source: "account-purge-database" },
        extra: { userId: candidate.id },
      });

      entries.push({
        userId: candidate.id,
        objectCount: keys.length,
        outcome: "DATABASE_FAILED",
      });
    }
  }

  return {
    dryRun: input.dryRun,
    eligible: candidates.length,
    purged: entries.filter((entry) => entry.outcome === "PURGED").length,
    failed: entries.filter(
      (entry) =>
        entry.outcome === "STORAGE_FAILED" ||
        entry.outcome === "DATABASE_FAILED",
    ).length,
    entries,
  };
}

export async function sendPurgeWarnings(input: {
  dryRun: boolean;
  now?: Date;
  limit?: number;
}) {
  const after = input.now ?? new Date();
  const before = new Date(
    after.getTime() + PURGE_WARNING_DAYS * 24 * 60 * 60 * 1000,
  );
  const limit = input.limit ?? PURGE_BATCH_SIZE;
  const candidates = await listAccountsNeedingPurgeWarning({
    after,
    before,
    limit,
  });

  if (input.dryRun) {
    return { warned: 0, eligible: candidates.length };
  }

  let warned = 0;

  for (const candidate of candidates) {
    if (!candidate.purgeAfter) {
      continue;
    }

    const claimed = await markPurgeWarned(candidate.id);

    if (!claimed) {
      continue;
    }

    try {
      await sendDeletionFinalWarningEmail({
        to: candidate.email,
        purgeAfter: candidate.purgeAfter,
      });
      warned += 1;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { source: "account-purge-warning" },
      });
    }
  }

  return { warned, eligible: candidates.length };
}
