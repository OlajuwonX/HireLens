import "server-only";

import { and, asc, eq, gt, isNotNull, isNull, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fileAssets, users } from "@/lib/db/schema";

export type PurgeCandidate = {
  id: string;
  email: string;
  purgeAfter: Date | null;
};

export async function listPurgeableAccounts(input: {
  before: Date;
  limit: number;
}): Promise<PurgeCandidate[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      purgeAfter: users.purgeAfter,
    })
    .from(users)
    .where(
      and(isNotNull(users.purgeAfter), lte(users.purgeAfter, input.before)),
    )
    .orderBy(asc(users.purgeAfter))
    .limit(input.limit);
}

export async function listStorageKeysForUser(userId: string) {
  return db
    .selectDistinct({ storageKey: fileAssets.storageKey })
    .from(fileAssets)
    .where(eq(fileAssets.userId, userId));
}

export async function isStillPurgeable(input: {
  userId: string;
  before: Date;
}) {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, input.userId),
        isNotNull(users.purgeAfter),
        lte(users.purgeAfter, input.before),
      ),
    )
    .limit(1);

  return Boolean(row);
}

export async function deletePurgeableAccount(input: {
  userId: string;
  before: Date;
}) {
  const [row] = await db
    .delete(users)
    .where(
      and(
        eq(users.id, input.userId),
        isNotNull(users.purgeAfter),
        lte(users.purgeAfter, input.before),
      ),
    )
    .returning({ id: users.id });

  return row ?? null;
}

export async function listAccountsNeedingPurgeWarning(input: {
  after: Date;
  before: Date;
  limit: number;
}): Promise<PurgeCandidate[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      purgeAfter: users.purgeAfter,
    })
    .from(users)
    .where(
      and(
        isNull(users.purgeWarnedAt),
        gt(users.purgeAfter, input.after),
        lte(users.purgeAfter, input.before),
      ),
    )
    .orderBy(asc(users.purgeAfter))
    .limit(input.limit);
}

export async function markPurgeWarned(userId: string) {
  const [row] = await db
    .update(users)
    .set({ purgeWarnedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(users.id, userId), isNull(users.purgeWarnedAt)))
    .returning({ id: users.id });

  return row ?? null;
}
