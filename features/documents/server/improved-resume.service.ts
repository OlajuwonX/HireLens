import "server-only";

import { normalizeJsonModelOutput } from "@/lib/ai";
import { getResumeAIProvider } from "@/lib/ai/provider";
import {
  improvedResumeSchema,
  type ImprovedResume,
} from "@/lib/ai/schemas/improved-resume.schema";
import { renderImprovedResumePdf } from "@/lib/pdf/resume-document";
import {
  improvedResumeFilename,
  improvedResumeToText,
} from "../improved-resume-format";
import { getStorageProvider } from "@/lib/storage/provider";
import type { StorageProvider } from "@/lib/storage";
import {
  createFileAsset,
  findFileAssetById,
  markFileAssetDeleted,
} from "@/features/files/server/file-asset.repository";
import { createResumeVersionWithFileAsset } from "@/features/resumes/server/resume-version.repository";
import type { Job, ResumeVersion } from "@/lib/db/schema";

export type ImprovedResumeArtifact = {
  resume: ImprovedResume;
  content: string;
  fileAssetId: string;
  provider: string;
  model: string;
};

export async function storeImprovedResumePdf(input: {
  userId: string;
  bytes: Uint8Array;
  filename: string;
  storageProvider?: StorageProvider;
}) {
  const storage = input.storageProvider ?? getStorageProvider();
  const buffer = new Uint8Array(input.bytes);
  const file = new File([buffer], input.filename, {
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

export async function buildImprovedResume(input: {
  userId: string;
  job: Job;
  version: ResumeVersion;
  notes: string | null;
  storageProvider?: StorageProvider;
}): Promise<ImprovedResumeArtifact> {
  const fileAsset = await findFileAssetById({
    userId: input.userId,
    id: input.version.fileAssetId,
  });

  if (!fileAsset || fileAsset.deletedAt) {
    throw new Error("The source resume file is unavailable");
  }

  const storage = input.storageProvider ?? getStorageProvider();
  const sourcePdf = await storage.readFile(fileAsset.storageKey);

  const providerResult = await getResumeAIProvider().generateImprovedResume({
    resume: {
      pdfBase64: Buffer.from(sourcePdf).toString("base64"),
      filename: fileAsset.originalFilename ?? "resume.pdf",
      text: input.version.extractedText,
    },
    jobTitle: input.job.title,
    company: input.job.company,
    jobDescription: input.job.description,
    requirements: input.job.requirements,
    notes: input.notes,
  });

  const resume = normalizeJsonModelOutput(
    providerResult.rawResponse,
    improvedResumeSchema,
  );

  const pdfBytes = await renderImprovedResumePdf(resume);
  const { stored } = await storeImprovedResumePdf({
    userId: input.userId,
    bytes: pdfBytes,
    filename: improvedResumeFilename(resume.fullName, input.job.title),
    storageProvider: storage,
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

  return {
    resume,
    content: improvedResumeToText(resume),
    fileAssetId: asset.id,
    provider: providerResult.provider,
    model: providerResult.model,
  };
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
