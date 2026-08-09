import "server-only";

import { StorageValidationError, type StorageProvider } from "@/lib/storage";
import { StorageProviderError } from "@/lib/storage";
import { getStorageProvider } from "@/lib/storage/provider";
import type { ResumeVersion } from "@/lib/db/schema";
import { getOwnedResume } from "./resume.service";
import {
  createResumeVersionWithFileAsset,
  findResumeVersionForUser,
  listAllResumeVersionsForUser,
  listResumeVersionsForUser,
  setDefaultResumeVersionForUser,
} from "./resume-version.repository";

export async function listOwnedVersionOptions(userId: string) {
  return listAllResumeVersionsForUser(userId);
}

export type CreateResumeVersionResult =
  | { ok: true; version: ResumeVersion }
  | { ok: false; error: "RESUME_NOT_FOUND" | "INVALID_FILE" | "UPLOAD_FAILED"; message: string };

export async function listOwnedResumeVersions(input: {
  userId: string;
  resumePublicId: string;
}) {
  const resume = await getOwnedResume({
    userId: input.userId,
    publicId: input.resumePublicId,
  });

  if (!resume) {
    return null;
  }

  const versions = await listResumeVersionsForUser({
    userId: input.userId,
    resumeId: resume.id,
  });

  return { resume, versions };
}

export async function createOwnedResumeVersionFromUpload(input: {
  userId: string;
  resumePublicId: string;
  label: string;
  file: File;
  storageProvider?: StorageProvider;
}): Promise<CreateResumeVersionResult> {
  const resume = await getOwnedResume({
    userId: input.userId,
    publicId: input.resumePublicId,
  });

  if (!resume) {
    return {
      ok: false,
      error: "RESUME_NOT_FOUND",
      message: "That resume could not be found.",
    };
  }

  const storage = input.storageProvider ?? getStorageProvider();
  const originalFilename = input.file.name || "resume.pdf";

  let stored;

  try {
    stored = await storage.uploadResume({
      userId: input.userId,
      file: input.file,
      originalFilename,
      contentType: input.file.type || "application/pdf",
    });
  } catch (error) {
    if (error instanceof StorageValidationError) {
      return { ok: false, error: "INVALID_FILE", message: error.message };
    }

    if (error instanceof StorageProviderError) {
      return {
        ok: false,
        error: "UPLOAD_FAILED",
        message:
          "The file could not be uploaded. Check storage setup or try again.",
      };
    }

    return {
      ok: false,
      error: "UPLOAD_FAILED",
      message: "The file could not be uploaded. Please try again.",
    };
  }

  try {
    const version = await createResumeVersionWithFileAsset({
      userId: input.userId,
      resumeId: resume.id,
      label: input.label,
      fileAsset: {
        storageProvider: stored.provider,
        storageKey: stored.storageKey,
        originalFilename: stored.originalFilename,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
      },
    });

    return { ok: true, version };
  } catch {
    await storage.deleteFile(stored.storageKey).catch(() => undefined);

    return {
      ok: false,
      error: "UPLOAD_FAILED",
      message: "The version could not be saved. Please try again.",
    };
  }
}

export async function getOwnedResumeVersion(input: {
  userId: string;
  versionPublicId: string;
}) {
  return findResumeVersionForUser({
    userId: input.userId,
    publicId: input.versionPublicId,
  });
}

export async function createOwnedResumeVersionReadUrl(input: {
  userId: string;
  storageKey: string;
  storageProvider?: StorageProvider;
}) {
  const storage = input.storageProvider ?? getStorageProvider();

  return storage.createReadUrl(input.storageKey);
}

export async function setOwnedDefaultResumeVersion(input: {
  userId: string;
  versionPublicId: string;
}) {
  const version = await getOwnedResumeVersion(input);

  if (!version) {
    return null;
  }

  return setDefaultResumeVersionForUser({
    userId: input.userId,
    resumeId: version.resumeId,
    versionId: version.id,
  });
}
