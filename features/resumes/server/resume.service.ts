import "server-only";

import type { StorageProvider } from "@/lib/storage";
import { getStorageProvider } from "@/lib/storage/provider";
import {
  archiveResumeForUser,
  createResume,
  deleteResumeForUser,
  findResumeForUser,
  listResumesForUser,
  listStorageKeysForResume,
  renameResumeForUser,
  retryResumeProcessingForUser,
} from "./resume.repository";

export async function createResumeRecord(input: {
  userId: string;
  title: string;
}) {
  return createResume({
    userId: input.userId,
    title: input.title,
    status: "UPLOADING",
  });
}

export async function getOwnedResume(input: {
  userId: string;
  publicId: string;
}) {
  return findResumeForUser(input);
}

export async function getResumeLibrary(userId: string) {
  return listResumesForUser(userId);
}

export async function renameOwnedResume(input: {
  userId: string;
  publicId: string;
  title: string;
}) {
  return renameResumeForUser(input);
}

export async function archiveOwnedResume(input: {
  userId: string;
  publicId: string;
  archived: boolean;
}) {
  return archiveResumeForUser(input);
}

export async function deleteOwnedResume(input: {
  userId: string;
  publicId: string;
  storageProvider?: StorageProvider;
}) {
  const resume = await findResumeForUser(input);

  if (!resume) {
    return null;
  }

  const keys = await listStorageKeysForResume({
    userId: input.userId,
    resumeId: resume.id,
  });

  const deleted = await deleteResumeForUser(input);
  const storage = input.storageProvider ?? getStorageProvider();

  await Promise.all(
    keys.map(({ storageKey }) =>
      storage.deleteFile(storageKey).catch(() => undefined),
    ),
  );

  return deleted;
}

export async function retryOwnedResumeProcessing(input: {
  userId: string;
  publicId: string;
}) {
  return retryResumeProcessingForUser(input);
}
