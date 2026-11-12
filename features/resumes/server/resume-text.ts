import "server-only";

import { findFileAssetById } from "@/features/files/server/file-asset.repository";
import type { ResumeVersion } from "@/lib/db/schema";
import { readResumeText } from "@/lib/pdf/extract-text";
import type { StorageProvider } from "@/lib/storage";
import { getStorageProvider } from "@/lib/storage/provider";

export async function readResumeVersionText(input: {
  userId: string;
  version: Pick<ResumeVersion, "extractedText" | "fileAssetId">;
  storage?: StorageProvider;
}) {
  const stored = input.version.extractedText?.trim();

  if (stored) {
    return stored;
  }

  const asset = await findFileAssetById({ userId: input.userId, id: input.version.fileAssetId });

  if (!asset || asset.deletedAt) {
    return null;
  }

  const storage = input.storage ?? getStorageProvider();
  const text = await readResumeText(await storage.readFile(asset.storageKey));

  return text?.trim() || null;
}
