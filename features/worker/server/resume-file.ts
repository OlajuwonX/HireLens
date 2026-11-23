import "server-only";

import type { ApplicationRow } from "@/features/applications/server/application.repository";
import { findFileAssetById } from "@/features/files/server/file-asset.repository";
import { getOwnedResumeVersion, listOwnedVersionOptions } from "@/features/resumes/server/resume-version.service";
import { renderImprovedResumePdf } from "@/lib/pdf/resume-document";
import { getStorageProvider } from "@/lib/storage/provider";
import { loadIntelligence } from "./task-payload";

export type ResumeFile = { bytes: Uint8Array; tailored: boolean };

export async function readVersionFile(userId: string, versionPublicId: string | null) {
  const version = versionPublicId ? await getOwnedResumeVersion({ userId, versionPublicId }) : null;
  const asset = version ? await findFileAssetById({ userId, id: version.fileAssetId }) : null;

  return asset && !asset.deletedAt ? getStorageProvider().readFile(asset.storageKey) : null;
}

export async function loadDefaultResume(userId: string): Promise<ResumeFile | null> {
  const [version] = await listOwnedVersionOptions(userId);
  const bytes = version ? await readVersionFile(userId, version.publicId) : null;

  return bytes ? { bytes, tailored: false } : null;
}

export async function loadApplicationResume(userId: string, row: ApplicationRow): Promise<ResumeFile | null> {
  const intelligence = await loadIntelligence({ userId, applicationId: row.application.id });

  if (intelligence && intelligence.improvedResume.experience.length > 0) {
    return { bytes: await renderImprovedResumePdf(intelligence.improvedResume), tailored: true };
  }

  const bytes = await readVersionFile(userId, row.versionPublicId);

  return bytes ? { bytes, tailored: false } : loadDefaultResume(userId);
}
