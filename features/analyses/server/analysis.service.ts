import "server-only";

import {
  RESUME_ANALYSIS_PROMPT_VERSION,
  hashAnalysisInput,
  normalizeJsonModelOutput,
  type ResumeAIProvider,
} from "@/lib/ai";
import { getResumeAIProvider } from "@/lib/ai/provider";
import { generalResumeAnalysisSchema } from "@/lib/ai/schemas/resume-analysis.schema";
import { getStorageProvider } from "@/lib/storage/provider";
import type { StorageProvider } from "@/lib/storage";
import { findFileAssetById } from "@/features/files/server/file-asset.repository";
import { getOwnedResumeVersion } from "@/features/resumes/server/resume-version.service";
import {
  createAnalysisSuggestions,
  createPendingAnalysis,
  deleteAnalysisSuggestions,
  findAnalysisByInputHash,
  findAnalysisForUser,
  findSucceededAnalysisByInputHash,
  listAnalysesForResumeVersion,
  markAnalysisFailed,
  markAnalysisSucceeded,
  resetAnalysisToPending,
} from "./analysis.repository";

function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

export async function runGeneralResumeAnalysis(input: {
  userId: string;
  versionPublicId: string;
  provider?: ResumeAIProvider;
  storageProvider?: StorageProvider;
}) {
  const version = await getOwnedResumeVersion({
    userId: input.userId,
    versionPublicId: input.versionPublicId,
  });

  if (!version) {
    return null;
  }

  const fileAsset = await findFileAssetById({
    userId: input.userId,
    id: version.fileAssetId,
  });

  if (!fileAsset || fileAsset.deletedAt) {
    return null;
  }

  const inputHash = await hashAnalysisInput({
    type: "GENERAL",
    promptVersion: RESUME_ANALYSIS_PROMPT_VERSION,
    resumeVersionId: version.id,
    storageKey: fileAsset.storageKey,
  });

  const reusable = await findSucceededAnalysisByInputHash({
    userId: input.userId,
    inputHash,
  });

  if (reusable) {
    return reusable;
  }

  const existing = await findAnalysisByInputHash({
    userId: input.userId,
    inputHash,
  });

  const pendingAnalysis = existing
    ? await resetAnalysisToPending({
        analysisId: existing.id,
        userId: input.userId,
        promptVersion: RESUME_ANALYSIS_PROMPT_VERSION,
      })
    : await createPendingAnalysis({
        userId: input.userId,
        resumeVersionId: version.id,
        type: "GENERAL",
        provider: "pending",
        model: "pending",
        promptVersion: RESUME_ANALYSIS_PROMPT_VERSION,
        inputHash,
      });

  if (!pendingAnalysis) {
    return null;
  }

  if (existing) {
    await deleteAnalysisSuggestions({
      userId: input.userId,
      analysisId: pendingAnalysis.id,
    });
  }

  const provider = input.provider ?? getResumeAIProvider();
  const storage = input.storageProvider ?? getStorageProvider();
  const startedAt = performance.now();

  try {
    const pdfBytes = await storage.readFile(fileAsset.storageKey);

    const providerResult = await provider.analyzeResume({
      resume: {
        pdfBase64: toBase64(pdfBytes),
        filename: fileAsset.originalFilename ?? "resume.pdf",
        text: version.extractedText,
      },
    });

    const normalized = normalizeJsonModelOutput(
      providerResult.rawResponse,
      generalResumeAnalysisSchema,
    );

    const analysis = await markAnalysisSucceeded({
      analysisId: pendingAnalysis.id,
      userId: input.userId,
      provider: providerResult.provider,
      model: providerResult.model,
      rawResponse: providerResult.rawResponse,
      normalizedResult: normalized,
      overallScore: normalized.overallScore,
      atsScore: normalized.atsScore,
      durationMs: providerResult.durationMs,
    });

    await createAnalysisSuggestions({
      userId: input.userId,
      analysisId: pendingAnalysis.id,
      recommendations: normalized.recommendations,
    });

    return analysis;
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);

    return markAnalysisFailed({
      analysisId: pendingAnalysis.id,
      userId: input.userId,
      durationMs,
      failureReason:
        error instanceof Error ? error.message : "Unknown analysis failure",
    });
  }
}

export async function listOwnedVersionAnalyses(input: {
  userId: string;
  versionPublicId: string;
}) {
  const version = await getOwnedResumeVersion({
    userId: input.userId,
    versionPublicId: input.versionPublicId,
  });

  if (!version) {
    return null;
  }

  const analyses = await listAnalysesForResumeVersion({
    userId: input.userId,
    resumeVersionId: version.id,
  });

  return { version, analyses };
}

export async function getOwnedAnalysis(input: {
  userId: string;
  analysisPublicId: string;
}) {
  return findAnalysisForUser({
    userId: input.userId,
    publicId: input.analysisPublicId,
  });
}
