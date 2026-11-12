import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { workerTokens } from "@/lib/db/schema";

export async function insertWorkerToken(input: { userId: string; name: string; tokenHash: string }) {
  const [row] = await db.insert(workerTokens).values(input).returning({ publicId: workerTokens.publicId });

  return row;
}

export async function listWorkerTokens(userId: string) {
  return db
    .select({
      publicId: workerTokens.publicId,
      name: workerTokens.name,
      lastUsedAt: workerTokens.lastUsedAt,
      createdAt: workerTokens.createdAt,
    })
    .from(workerTokens)
    .where(and(eq(workerTokens.userId, userId), isNull(workerTokens.revokedAt)))
    .orderBy(desc(workerTokens.createdAt));
}

export async function revokeWorkerToken(input: { userId: string; publicId: string }) {
  await db
    .update(workerTokens)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(workerTokens.userId, input.userId), eq(workerTokens.publicId, input.publicId)));
}

export async function findActiveToken(tokenHash: string) {
  const [row] = await db
    .select({ id: workerTokens.id, publicId: workerTokens.publicId, userId: workerTokens.userId })
    .from(workerTokens)
    .where(and(eq(workerTokens.tokenHash, tokenHash), isNull(workerTokens.revokedAt)))
    .limit(1);

  return row ?? null;
}

export async function touchWorkerToken(id: string) {
  await db.update(workerTokens).set({ lastUsedAt: new Date() }).where(eq(workerTokens.id, id));
}
