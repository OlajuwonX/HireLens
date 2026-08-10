import { aiFailureMessage, describeAiFailure } from "@/lib/ai/ai-failure";
import "server-only";

import {
  JOB_FIT_ANALYSIS_PROMPT_VERSION,
  hashAnalysisInput,
  normalizeJsonModelOutput,
  type ResumeAIProvider,
} from "@/lib/ai";
import { getResumeAIProvider } from "@/lib/ai/provider";
import { jobFitAnalysisSchema } from "@/lib/ai/schemas/job-fit-analysis.schema";
import { getStorageProvider } from "@/lib/storage/provider";
import type { StorageProvider } from "@/lib/storage";
import { findFileAssetById } from "@/features/files/server/file-asset.repository";
import { getOwnedJob } from "@/features/jobs/server/job.service";
import { getOwnedResumeVersion } from "@/features/resumes/server/resume-version.service";
import {
  completeUsage,
  failUsage,
  reserveUsage,
} from "@/features/usage/server/ai-usage.service";
import {
  createAnalysisSuggestions,
  createPendingAnalysis,
  deleteAnalysisSuggestions,
  findAnalysisByInputHash,
  findSucceededAnalysisByInputHash,
  markAnalysisFailed,
  markAnalysisSucceeded,
  resetAnalysisToPending,
} from "./analysis.repository";
import {
  listCorrectionsForResumeVersion,
  replaceRequirementMatches,
} from "./requirement-match.repository";

export type JobFitResult =
  | { ok: true; analysisId: string; analysisPublicId: string; reused: boolean }
  | { ok: false; error: "NOT_FOUND" | "FILE_MISSING" | "FAILED"; message: string };

export async function runJobFitAnalysis(input: {
  userId: string;
  versionPublicId: string;
  jobPublicId: string;
  provider?: ResumeAIProvider;
  storageProvider?: StorageProvider;
}): Promise<JobFitResult> {
  const [version, job] = await Promise.all([
    getOwnedResumeVersion({
      userId: input.userId,
      versionPublicId: input.versionPublicId,
    }),
    getOwnedJob({ userId: input.userId, publicId: input.jobPublicId }),
  ]);

  if (!version || !job) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "That resume version or job could not be found.",
    };
  }

  const fileAsset = await findFileAssetById({
    userId: input.userId,
    id: version.fileAssetId,
  });

  if (!fileAsset || fileAsset.deletedAt) {
    return {
      ok: false,
      error: "FILE_MISSING",
      message: "The resume file for this version is no longer available.",
    };
  }

  const corrections = await listCorrectionsForResumeVersion({
    userId: input.userId,
    resumeVersionId: version.id,
  });

  const inputHash = await hashAnalysisInput({
    type: "JOB_SPECIFIC",
    aiAction: "JOB_FIT_ANALYSIS",
    promptVersion: JOB_FIT_ANALYSIS_PROMPT_VERSION,
    resumeVersionId: version.id,
    storageKey: fileAsset.storageKey,
    jobId: job.id,
    jobUpdatedAt: job.updatedAt.toISOString(),
    corrections: corrections.map((correction) => ({
      requirement: correction.requirement,
      markedIncorrect: correction.markedIncorrect,
      evidence: correction.evidence,
      notes: correction.notes,
    })),
  });

  const reusable = await findSucceededAnalysisByInputHash({
    userId: input.userId,
    inputHash,
  });

  if (reusable) {
    return {
      ok: true,
      analysisId: reusable.id,
      analysisPublicId: reusable.publicId,
      reused: true,
    };
  }

  const existing = await findAnalysisByInputHash({
    userId: input.userId,
    inputHash,
  });

  const pending = existing
    ? await resetAnalysisToPending({
        analysisId: existing.id,
        userId: input.userId,
        promptVersion: JOB_FIT_ANALYSIS_PROMPT_VERSION,
      })
    : await createPendingAnalysis({
        userId: input.userId,
        resumeVersionId: version.id,
        jobId: job.id,
        type: "JOB_SPECIFIC",
        provider: "pending",
        model: "pending",
        promptVersion: JOB_FIT_ANALYSIS_PROMPT_VERSION,
        inputHash,
      });

  if (!pending) {
    return {
      ok: false,
      error: "FAILED",
      message: "Could not start the analysis.",
    };
  }

  if (existing) {
    await deleteAnalysisSuggestions({
      userId: input.userId,
      analysisId: pending.id,
    });
  }

  const provider = input.provider ?? getResumeAIProvider();
  const storage = input.storageProvider ?? getStorageProvider();
  const startedAt = performance.now();
  let pdfBytes: Uint8Array;

  try {
    pdfBytes = await storage.readFile(fileAsset.storageKey);
  } catch {
    await markAnalysisFailed({
      analysisId: pending.id,
      userId: input.userId,
      durationMs: Math.round(performance.now() - startedAt),
      failureReason: "StorageReadFailed",
    });

    return {
      ok: false,
      error: "FAILED",
      message: "The resume file could not be prepared for analysis.",
    };
  }

  const reservation = await reserveUsage({
    userId: input.userId,
    action: "JOB_ANALYSIS",
  });

  if (!reservation.ok) {
    await markAnalysisFailed({
      analysisId: pending.id,
      userId: input.userId,
      durationMs: Math.round(performance.now() - startedAt),
      failureReason: reservation.reason,
    });

    return {
      ok: false,
      error: "FAILED",
      message: reservation.message,
    };
  }

  try {
    const providerResult = await provider.analyzeResumeForJob({
      resume: {
        pdfBase64: Buffer.from(pdfBytes).toString("base64"),
        filename: fileAsset.originalFilename ?? "resume.pdf",
        text: version.extractedText,
      },
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description,
      requirements: job.requirements,
      priorCorrections: corrections.map((correction) => ({
        requirement: correction.requirement,
        markedIncorrect: correction.markedIncorrect,
        evidence: correction.evidence,
        notes: correction.notes,
      })),
    });

    const normalized = normalizeJsonModelOutput(
      providerResult.rawResponse,
      jobFitAnalysisSchema,
    );

    await completeUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "JOB_ANALYSIS",
      provider: providerResult.provider,
      model: providerResult.model,
      inputHash,
    });

    const analysis = await markAnalysisSucceeded({
      analysisId: pending.id,
      userId: input.userId,
      provider: providerResult.provider,
      model: providerResult.model,
      rawResponse: providerResult.rawResponse,
      normalizedResult: normalized,
      overallScore: normalized.overallScore,
      atsScore: normalized.atsScore,
      durationMs: providerResult.durationMs,
    });

    await replaceRequirementMatches({
      userId: input.userId,
      analysisId: pending.id,
      matches: normalized.requirementMatches,
    });

    await createAnalysisSuggestions({
      userId: input.userId,
      analysisId: pending.id,
      recommendations: normalized.recommendations,
    });

    return {
      ok: true,
      analysisId: analysis?.id ?? pending.id,
      analysisPublicId: analysis?.publicId ?? pending.publicId,
      reused: false,
    };
  } catch (error) {
    const failureReason = describeAiFailure(error);

    console.error("Job fit analysis failed", {
      userId: input.userId,
      versionPublicId: input.versionPublicId,
      jobPublicId: input.jobPublicId,
      error: error instanceof Error ? error.name : "UnknownError",
      message: failureReason,
    });

    await failUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action: "JOB_ANALYSIS",
      inputHash,
      failureReason,
    });

    await markAnalysisFailed({
      analysisId: pending.id,
      userId: input.userId,
      durationMs: Math.round(performance.now() - startedAt),
      failureReason,
    });

    return {
      ok: false,
      error: "FAILED",
      message: aiFailureMessage(
        error,
        "The analysis could not be completed. Try again.",
      ),
    };
  }
}
