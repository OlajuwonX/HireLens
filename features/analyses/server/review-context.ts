import "server-only";

import { findApplicationRowForUser } from "@/features/applications/server/application.repository";
import { findFileAssetById } from "@/features/files/server/file-asset.repository";
import { getOwnedResumeVersion } from "@/features/resumes/server/resume-version.service";
import { readResumeText } from "@/lib/pdf/extract-text";
import { getStorageProvider } from "@/lib/storage/provider";
import type { StorageProvider } from "@/lib/storage";
import type { ResumeVersion } from "@/lib/db/schema";
import { readStoredIntelligence } from "./analysis.mapper";
import { findAnalysisForApplication, listCorrectionsForAnalysis } from "./analysis.repository";

export type ReviewContextFailure = "NOT_FOUND" | "NO_RESUME" | "NO_TEXT";

async function readSourceText(input: {
  userId: string;
  version: ResumeVersion;
  storage: StorageProvider;
}) {
  const stored = input.version.extractedText?.trim();

  if (stored) {
    return stored;
  }

  const asset = await findFileAssetById({ userId: input.userId, id: input.version.fileAssetId });

  if (!asset || asset.deletedAt) {
    return null;
  }

  return (await readResumeText(await input.storage.readFile(asset.storageKey)))?.trim() || null;
}

export async function findOwnedAnalysis(input: { userId: string; publicId: string }) {
  const row = await findApplicationRowForUser(input);
  const analysis = row
    ? await findAnalysisForApplication({ userId: input.userId, applicationId: row.application.id })
    : null;
  const stored = analysis ? readStoredIntelligence(analysis) : null;

  if (!row || !analysis || !stored || stored.improvedResume.experience.length === 0) {
    return null;
  }

  const corrections = await listCorrectionsForAnalysis({
    userId: input.userId,
    analysisId: analysis.id,
  });

  return { row, analysis, stored, corrections };
}

export async function loadReviewContext(input: {
  userId: string;
  publicId: string;
  storage?: StorageProvider;
}) {
  const owned = await findOwnedAnalysis(input);

  if (!owned) {
    return { ok: false as const, error: "NO_RESUME" as ReviewContextFailure };
  }

  const { row, analysis, stored, corrections } = owned;

  if (!row.versionPublicId) {
    return { ok: false as const, error: "NOT_FOUND" as ReviewContextFailure };
  }

  const version = await getOwnedResumeVersion({
    userId: input.userId,
    versionPublicId: row.versionPublicId,
  });
  const sourceText = version
    ? await readSourceText({
        userId: input.userId,
        version,
        storage: input.storage ?? getStorageProvider(),
      })
    : null;

  if (!sourceText) {
    return { ok: false as const, error: "NO_TEXT" as ReviewContextFailure };
  }

  return { ok: true as const, job: row.job, analysis, stored, sourceText, corrections };
}
