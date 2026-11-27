import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { gmailConnections, type GmailConnection } from "@/lib/db/schema";

export async function findGmailConnection(userId: string) {
  const [row] = await db.select().from(gmailConnections).where(eq(gmailConnections.userId, userId)).limit(1);

  return row ?? null;
}

export async function listActiveGmailConnections() {
  return db.select().from(gmailConnections).where(eq(gmailConnections.status, "CONNECTED"));
}

export async function saveGmailConnection(input: { userId: string; refreshTokenCipher: string }) {
  const now = new Date();

  await db
    .insert(gmailConnections)
    .values({ userId: input.userId, refreshTokenCipher: input.refreshTokenCipher, status: "CONNECTED", lastError: null })
    .onConflictDoUpdate({
      target: gmailConnections.userId,
      set: { refreshTokenCipher: input.refreshTokenCipher, status: "CONNECTED", lastError: null, updatedAt: now },
    });
}

export async function recordGmailCheck(input: {
  userId: string;
  status: GmailConnection["status"];
  lastError: string | null;
  checkedAt: Date | null;
}) {
  await db
    .update(gmailConnections)
    .set({
      status: input.status,
      lastError: input.lastError,
      ...(input.checkedAt ? { lastCheckedAt: input.checkedAt } : {}),
      updatedAt: new Date(),
    })
    .where(eq(gmailConnections.userId, input.userId));
}

export async function deleteGmailConnection(userId: string) {
  const [row] = await db.delete(gmailConnections).where(eq(gmailConnections.userId, userId)).returning();

  return row ?? null;
}
