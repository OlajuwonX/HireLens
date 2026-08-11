import "server-only";

import type { ImprovedResume } from "@/lib/ai/schemas/improved-resume.schema";
import { renderImprovedResumePdf } from "@/lib/pdf/resume-document";
import { getStorageProvider } from "@/lib/storage/provider";
import type { StorageProvider } from "@/lib/storage";
import {
  createFileAsset,
  findFileAssetById,
  markFileAssetDeleted,
} from "@/features/files/server/file-asset.repository";
import { createResumeVersionWithFileAsset } from "@/features/resumes/server/resume-version.repository";
import {
  improvedResumeFilename,
  improvedResumeVersionLabel,
} from "../improved-resume-format";

export { improvedResumeFilename, improvedResumeVersionLabel };

export async function storeImprovedResumePdf(input: {
  userId: string;
  bytes: Uint8Array;
  filename: string;
  storageProvider?: StorageProvider;
}) {
  const storage = input.storageProvider ?? getStorageProvider();
  const file = new File([new Uint8Array(input.bytes)], input.filename, {
    type: "application/pdf",
  });

  const stored = await storage.uploadResume({
    userId: input.userId,
    file,
    originalFilename: input.filename,
    contentType: "application/pdf",
  });

  return { stored, storage };
}

export async function buildImprovedResumePdf(input: {
  userId: string;
  resume: ImprovedResume;
  jobTitle: string | null;
  storageProvider?: StorageProvider;
}) {
  const bytes = await renderImprovedResumePdf(input.resume);
  const { stored } = await storeImprovedResumePdf({
    userId: input.userId,
    bytes,
    filename: improvedResumeFilename(
      input.resume.header.name,
      input.jobTitle ?? input.resume.header.headline,
    ),
    storageProvider: input.storageProvider,
  });

  const asset = await createFileAsset({
    userId: input.userId,
    kind: "GENERATED_DOCUMENT",
    storageProvider: stored.provider,
    storageKey: stored.storageKey,
    originalFilename: stored.originalFilename,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
  });

  return asset.id;
}

export async function createImprovedResumeReadUrl(input: {
  userId: string;
  fileAssetId: string;
  storageProvider?: StorageProvider;
}) {
  const asset = await findFileAssetById({
    userId: input.userId,
    id: input.fileAssetId,
  });

  if (!asset || asset.deletedAt) {
    return null;
  }

  const storage = input.storageProvider ?? getStorageProvider();
  const readUrl = await storage.createReadUrl(asset.storageKey);

  return { ...readUrl, filename: asset.originalFilename ?? "resume.pdf" };
}

export async function removeImprovedResumeFile(input: {
  userId: string;
  fileAssetId: string;
  storageProvider?: StorageProvider;
}) {
  const asset = await findFileAssetById({
    userId: input.userId,
    id: input.fileAssetId,
  });

  if (!asset || asset.deletedAt) {
    return;
  }

  const storage = input.storageProvider ?? getStorageProvider();

  await storage.deleteFile(asset.storageKey);
  await markFileAssetDeleted({
    userId: input.userId,
    storageKey: asset.storageKey,
  });
}

export async function copyImprovedResumeToVersion(input: {
  userId: string;
  fileAssetId: string;
  resumeId: string;
  label: string;
  storageProvider?: StorageProvider;
}) {
  const asset = await findFileAssetById({
    userId: input.userId,
    id: input.fileAssetId,
  });

  if (!asset || asset.deletedAt) {
    throw new Error("The improved resume file is unavailable");
  }

  const storage = input.storageProvider ?? getStorageProvider();
  const bytes = await storage.readFile(asset.storageKey);
  const { stored } = await storeImprovedResumePdf({
    userId: input.userId,
    bytes,
    filename: asset.originalFilename ?? "improved-resume.pdf",
    storageProvider: storage,
  });

  try {
    return await createResumeVersionWithFileAsset({
      userId: input.userId,
      resumeId: input.resumeId,
      label: input.label,
      fileAsset: {
        storageProvider: stored.provider,
        storageKey: stored.storageKey,
        originalFilename: stored.originalFilename,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      },
    });
  } catch (error) {
    await storage.deleteFile(stored.storageKey).catch(() => undefined);
    throw error;
  }
}

export async function readImprovedResumeBytes(input: {
  userId: string;
  fileAssetId: string;
  storageProvider?: StorageProvider;
}) {
  const asset = await findFileAssetById({
    userId: input.userId,
    id: input.fileAssetId,
  });

  if (!asset || asset.deletedAt) {
    return null;
  }

  const storage = input.storageProvider ?? getStorageProvider();
  const bytes = await storage.readFile(asset.storageKey);

  return { bytes, filename: asset.originalFilename ?? "resume.pdf" };
}
