import "server-only";

import { findFileAssetByPublicIdForUser } from "@/features/files/server/file-asset.repository";
import { getOwnedResume } from "./resume.service";
import {
  createResumeVersion,
  findResumeVersionForUser,
  getNextResumeVersionNumber,
  listResumeVersionsForUser,
  setDefaultResumeVersionForUser,
} from "./resume-version.repository";

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

export async function createOwnedResumeVersion(input: {
  userId: string;
  resumePublicId: string;
  fileAssetPublicId: string;
  label: string;
}) {
  const resume = await getOwnedResume({
    userId: input.userId,
    publicId: input.resumePublicId,
  });

  if (!resume) {
    return null;
  }

  const fileAsset = await findFileAssetByPublicIdForUser({
    userId: input.userId,
    publicId: input.fileAssetPublicId,
  });

  if (!fileAsset || fileAsset.kind !== "RESUME_PDF") {
    return null;
  }

  const versionNumber = await getNextResumeVersionNumber({
    userId: input.userId,
    resumeId: resume.id,
  });

  const version = await createResumeVersion({
    userId: input.userId,
    resumeId: resume.id,
    fileAssetId: fileAsset.id,
    label: input.label,
    versionNumber,
    isDefault: versionNumber === 1,
  });

  if (version.isDefault) {
    await setDefaultResumeVersionForUser({
      userId: input.userId,
      resumeId: resume.id,
      versionId: version.id,
    });
  }

  return version;
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
