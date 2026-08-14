import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fileAssets, type NewFileAsset } from "@/lib/db/schema";

export async function createFileAsset(input: NewFileAsset) {
  const [fileAsset] = await db.insert(fileAssets).values(input).returning();
  return fileAsset;
}

export async function findFileAssetById(input: { userId: string; id: string }) {
  const [fileAsset] = await db
    .select()
    .from(fileAssets)
    .where(
      and(eq(fileAssets.userId, input.userId), eq(fileAssets.id, input.id)),
    )
    .limit(1);

  return fileAsset ?? null;
}

export async function markFileAssetDeleted(input: {
  userId: string;
  storageKey: string;
}) {
  const [fileAsset] = await db
    .update(fileAssets)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(fileAssets.userId, input.userId),
        eq(fileAssets.storageKey, input.storageKey),
      ),
    )
    .returning();

  return fileAsset ?? null;
}
