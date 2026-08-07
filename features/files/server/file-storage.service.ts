import "server-only";

import type { StorageProvider } from "@/lib/storage";
import type { FileAsset } from "@/lib/db/schema";
import {
  createFileAsset,
  markFileAssetDeleted,
} from "./file-asset.repository";

export async function storeResumePdf(input: {
  userId: string;
  file: File | Blob;
  originalFilename: string;
  contentType: string;
  storageProvider: StorageProvider;
}): Promise<FileAsset> {
  const storedFile = await input.storageProvider.uploadResume({
    userId: input.userId,
    file: input.file,
    originalFilename: input.originalFilename,
    contentType: input.contentType,
  });

  return createFileAsset({
    userId: input.userId,
    kind: "RESUME_PDF",
    storageProvider: storedFile.provider,
    storageKey: storedFile.storageKey,
    originalFilename: storedFile.originalFilename,
    mimeType: storedFile.mimeType,
    sizeBytes: storedFile.sizeBytes,
  });
}

export async function deleteStoredFile(input: {
  userId: string;
  storageKey: string;
  storageProvider: StorageProvider;
}) {
  await input.storageProvider.deleteFile(input.storageKey);

  return markFileAssetDeleted({
    userId: input.userId,
    storageKey: input.storageKey,
  });
}
