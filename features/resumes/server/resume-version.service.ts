import "server-only";

import { StorageValidationError, type StorageProvider } from "@/lib/storage";
import { StorageProviderError } from "@/lib/storage";
import { getStorageProvider } from "@/lib/storage/provider";
import type { Resume, ResumeVersion } from "@/lib/db/schema";
import { resumeVersionLabelFromFilename } from "@/features/resumes/version-label";
import {
  createResume,
  deleteResumeForUser,
  findActiveResumeByTitle,
} from "./resume.repository";
import { getOwnedResume } from "./resume.service";
import { findFileAssetById } from "@/features/files/server/file-asset.repository";
import {
  countResumeVersions,
  createResumeVersionWithFileAsset,
  deleteResumeVersionForUser,
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
  | {
      ok: false;
      error: "RESUME_NOT_FOUND" | "INVALID_FILE" | "UPLOAD_FAILED";
      message: string;
    };

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
  dedupeLabel?: boolean;
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
      dedupeLabel: input.dedupeLabel,
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

export type UploadResumeResult =
  | { ok: true; resume: Resume; version: ResumeVersion; createdGroup: boolean }
  | {
      ok: false;
      error:
        | "RESUME_NOT_FOUND"
        | "TITLE_EXISTS"
        | "INVALID_FILE"
        | "UPLOAD_FAILED";
      message: string;
    };

export async function uploadResumeToJobTitle(input: {
  userId: string;
  resumePublicId?: string;
  title?: string;
  file: File;
  storageProvider?: StorageProvider;
}): Promise<UploadResumeResult> {
  let resume: Resume | null = null;
  let createdGroup = false;

  if (input.resumePublicId) {
    resume = await getOwnedResume({
      userId: input.userId,
      publicId: input.resumePublicId,
    });

    if (!resume) {
      return {
        ok: false,
        error: "RESUME_NOT_FOUND",
        message: "That job title could not be found.",
      };
    }
  } else {
    const title = (input.title ?? "").trim();
    const existing = await findActiveResumeByTitle({
      userId: input.userId,
      title,
    });

    if (existing) {
      return {
        ok: false,
        error: "TITLE_EXISTS",
        message: `"${existing.title}" already exists. Pick it from the job title list to add another resume.`,
      };
    }

    resume = await createResume({ userId: input.userId, title });
    createdGroup = true;
  }

  const result = await createOwnedResumeVersionFromUpload({
    userId: input.userId,
    resumePublicId: resume.publicId,
    label: resumeVersionLabelFromFilename(input.file.name),
    dedupeLabel: true,
    file: input.file,
    storageProvider: input.storageProvider,
  });

  if (!result.ok) {
    if (createdGroup) {
      await deleteResumeForUser({
        userId: input.userId,
        publicId: resume.publicId,
      }).catch(() => undefined);
    }

    return result;
  }

  return { ok: true, resume, version: result.version, createdGroup };
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

export async function deleteOwnedResumeVersion(input: {
  userId: string;
  versionPublicId: string;
  storageProvider?: StorageProvider;
}) {
  const version = await findResumeVersionForUser({
    userId: input.userId,
    publicId: input.versionPublicId,
  });

  if (!version) {
    return { ok: false as const, message: "That version could not be found." };
  }

  const remaining = await countResumeVersions({
    userId: input.userId,
    resumeId: version.resumeId,
  });

  if (remaining <= 1) {
    return {
      ok: false as const,
      message: "A resume group needs at least one version.",
    };
  }

  const fileAsset = await findFileAssetById({
    userId: input.userId,
    id: version.fileAssetId,
  });

  const deleted = await deleteResumeVersionForUser({
    userId: input.userId,
    versionId: version.id,
  });

  if (!deleted) {
    return {
      ok: false as const,
      message: "That version could not be deleted.",
    };
  }

  if (fileAsset) {
    const storage = input.storageProvider ?? getStorageProvider();

    await storage.deleteFile(fileAsset.storageKey).catch(() => undefined);
  }

  return { ok: true as const, label: version.label };
}
