import "server-only";

import type { StorageProvider } from "@/lib/storage";
import { getStorageProvider } from "@/lib/storage/provider";
import {
  archiveResumeForUser,
  deleteResumeForUser,
  findActiveResumeByTitle,
  findResumeForUser,
  listResumesForUser,
  listStorageKeysForResume,
  renameResumeForUser,
  retryResumeProcessingForUser,
} from "./resume.repository";

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
  const conflict = await findActiveResumeByTitle({
    userId: input.userId,
    title: input.title,
  });

  if (conflict && conflict.publicId !== input.publicId) {
    return {
      ok: false as const,
      message: `"${conflict.title}" already exists. Pick a different job title.`,
    };
  }

  const resume = await renameResumeForUser(input);

  if (!resume) {
    return {
      ok: false as const,
      message: "That job title could not be found.",
    };
  }

  return { ok: true as const, resume };
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
