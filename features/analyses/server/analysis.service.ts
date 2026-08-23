import "server-only";

import {
  APPLICATION_INTELLIGENCE_PROMPT_VERSION,
  applicationIntelligenceSchema,
  AiProviderChainError,
  collectResumeEntities,
  compareOptimizationPasses,
  describeAiFailure,
  hashAnalysisInput,
  normalizeJsonModelOutput,
} from "@/lib/ai";
import { aiFailureMessage } from "@/lib/ai/errors";
import { getApplicationIntelligenceProvider } from "@/lib/ai/client";
import type {
  AIProviderResult,
  ApplicationIntelligenceProvider,
} from "@/lib/ai/types";
import type { ApplicationIntelligence } from "@/lib/ai/schemas/application-intelligence.schema";
import { readResumeText } from "@/lib/pdf/extract-text";
import { getStorageProvider } from "@/lib/storage/provider";
import type { StorageProvider } from "@/lib/storage";
import { findFileAssetById } from "@/features/files/server/file-asset.repository";
import {
  completeUsage,
  failUsage,
  reserveUsage,
} from "@/features/usage/server/ai-usage.service";
import {
  employmentTypeLabels,
  workArrangementLabels,
} from "@/features/jobs/constants";
import type { Job, ResumeVersion } from "@/lib/db/schema";
import {
  improvedResumeToText,
  mergeCorrections,
  readStoredIntelligence,
} from "./analysis.mapper";
import type { StoredApplicationIntelligence } from "@/lib/ai/schemas/application-intelligence.schema";
import {
  createPendingAnalysis,
  findAnalysisByInputHash,
  findAnalysisForApplication,
  listCorrectionsForAnalysis,
  markAnalysisFailed,
  markAnalysisSucceeded,
  resetAnalysisToPending,
} from "./analysis.repository";

export type AnalysisOutcome =
  | { ok: true; analysisId: string; analysisPublicId: string; reused: boolean }
  | { ok: false; error: "FILE_MISSING" | "FAILED"; message: string };

async function settleUsage(work: Promise<unknown>, stage: string) {
  try {
    await work;
  } catch (error) {
    console.error("Application analysis usage bookkeeping failed", {
      stage,
      reason: describeAiFailure(error),
    });
  }
}

const PREVIOUS_PASS_GAP_LIMIT = 12;

function describePreviousPass(previous: StoredApplicationIntelligence | null) {
  if (!previous) {
    return null;
  }

  const improvedResume = improvedResumeToText(previous.improvedResume).trim();

  if (!improvedResume) {
    return null;
  }

  return {
    improvedResume,
    professionalSummary: previous.professionalSummary,
    unresolvedRequirements: previous.requirementMatches
      .filter(
        (match) => match.status === "MISSING" || match.status === "PARTIAL",
      )
      .map((match) => match.requirement)
      .slice(0, PREVIOUS_PASS_GAP_LIMIT),
    unresolvedKeywords: previous.keywordAnalysis.missing
      .filter((item) => item.gapType === "WORDING_ONLY")
      .map((item) => item.keyword)
      .slice(0, PREVIOUS_PASS_GAP_LIMIT),
  };
}

function describeJobForHash(job: Job) {
  return {
    id: job.id,
    updatedAt: job.updatedAt.toISOString(),
    title: job.title,
    company: job.company,
    description: job.description,
    requirements: job.requirements,
  };
}

export async function analyzeApplication(input: {
  userId: string;
  job: Job;
  version: ResumeVersion;
  applicationId?: string | null;
  regenerate?: boolean;
  provider?: ApplicationIntelligenceProvider;
  storageProvider?: StorageProvider;
}): Promise<AnalysisOutcome> {
  const action = input.regenerate
    ? ("APPLICATION_REGENERATE" as const)
    : ("APPLICATION_ANALYSIS" as const);

  const inputHash = await hashAnalysisInput({
    aiAction: action,
    promptVersion: APPLICATION_INTELLIGENCE_PROMPT_VERSION,
    job: describeJobForHash(input.job),
    resumeVersionId: input.version.id,
  });

  const existing = await findAnalysisByInputHash({
    userId: input.userId,
    inputHash,
  });

  if (existing?.status === "SUCCEEDED" && !input.regenerate) {
    return {
      ok: true,
      analysisId: existing.id,
      analysisPublicId: existing.publicId,
      reused: true,
    };
  }

  const previousApplicationAnalysis =
    input.regenerate && input.applicationId
      ? await findAnalysisForApplication({
          userId: input.userId,
          applicationId: input.applicationId,
        })
      : null;

  const previousResult = input.regenerate
    ? ((previousApplicationAnalysis
        ? readStoredIntelligence(previousApplicationAnalysis)
        : null) ?? (existing ? readStoredIntelligence(existing) : null))
    : null;

  const fileAsset = await findFileAssetById({
    userId: input.userId,
    id: input.version.fileAssetId,
  });

  if (!fileAsset || fileAsset.deletedAt) {
    return {
      ok: false,
      error: "FILE_MISSING",
      message: "The resume file could not be prepared for analysis.",
    };
  }

  const pending = existing
    ? await resetAnalysisToPending({
        analysisId: existing.id,
        userId: input.userId,
        promptVersion: APPLICATION_INTELLIGENCE_PROMPT_VERSION,
      })
    : await createPendingAnalysis({
        userId: input.userId,
        applicationId: input.applicationId ?? null,
        resumeVersionId: input.version.id,
        jobId: input.job.id,
        provider: "pending",
        model: "pending",
        promptVersion: APPLICATION_INTELLIGENCE_PROMPT_VERSION,
        inputHash,
      });

  if (!pending) {
    return {
      ok: false,
      error: "FAILED",
      message: "The analysis could not be started.",
    };
  }

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
      error: "FILE_MISSING",
      message: "The resume file could not be prepared for analysis.",
    };
  }

  const corrections = await listCorrectionsForAnalysis({
    userId: input.userId,
    analysisId: pending.id,
  });

  const reservation = await reserveUsage({ userId: input.userId, action });

  if (!reservation.ok) {
    await markAnalysisFailed({
      analysisId: pending.id,
      userId: input.userId,
      durationMs: Math.round(performance.now() - startedAt),
      failureReason: reservation.reason,
    });

    return { ok: false, error: "FAILED", message: reservation.message };
  }

  const resumeText =
    input.version.extractedText?.trim() || (await readResumeText(pdfBytes));

  let providerResult: AIProviderResult;
  let result: ApplicationIntelligence;

  try {
    const provider = input.provider ?? getApplicationIntelligenceProvider();

    providerResult = await provider.analyzeApplication({
      resume: {
        pdfBytes,
        filename: fileAsset.originalFilename ?? "resume.pdf",
        text: resumeText,
      },
      job: {
        title: input.job.title,
        company: input.job.company,
        location: input.job.location,
        workArrangement: workArrangementLabels[input.job.workArrangement],
        employmentType: employmentTypeLabels[input.job.employmentType],
        deadline: input.job.deadlineAt?.toISOString().slice(0, 10) ?? null,
        source: input.job.source,
        sourceUrl: input.job.sourceUrl,
        description: input.job.description,
        requirements: input.job.requirements,
      },
      priorCorrections: corrections.map((correction) => ({
        requirement: correction.requirement,
        markedIncorrect: correction.markedIncorrect,
        evidence: correction.evidence,
        notes: correction.notes,
      })),
      previousPass: describePreviousPass(previousResult),
    });

    result = normalizeJsonModelOutput(
      providerResult.rawResponse,
      applicationIntelligenceSchema,
    );

    const regression = compareOptimizationPasses({
      sourceText: resumeText,
      previousResumeText: previousResult
        ? improvedResumeToText(previousResult.improvedResume)
        : null,
      nextResumeText: improvedResumeToText(result.improvedResume),
      previousEntities: previousResult
        ? collectResumeEntities(previousResult.improvedResume)
        : [],
      nextEntities: collectResumeEntities(result.improvedResume),
    });

    if (regression.keepPrevious && previousResult) {
      console.warn("Optimized resume rejected as a regression", {
        stage: "REGRESSION_GUARD",
        jobId: input.job.id,
        resumeVersionId: input.version.id,
        reason: regression.reason,
        previousPreserved: regression.previous?.preserved.length ?? null,
        nextPreserved: regression.next?.preserved.length ?? null,
        previousNamed: regression.previous?.preservedEntities.length ?? null,
        nextNamed: regression.next?.preservedEntities.length ?? null,
      });

      result = { ...result, improvedResume: previousResult.improvedResume };
    }
  } catch (error) {
    const failureReason = describeAiFailure(error);

    console.error("Application analysis AI request failed", {
      stage: "AI_REQUEST",
      userId: input.userId,
      jobId: input.job.id,
      resumeVersionId: input.version.id,
      resumeTextAvailable: Boolean(resumeText),
      failureReason,
      attempts:
        error instanceof AiProviderChainError ? error.attempts.length : null,
    });

    await settleUsage(
      failUsage({
        userId: input.userId,
        reservationId: reservation.reservationId,
        action,
        inputHash,
        failureReason,
      }),
      "fail",
    );

    await settleUsage(
      markAnalysisFailed({
        analysisId: pending.id,
        userId: input.userId,
        durationMs: Math.round(performance.now() - startedAt),
        failureReason,
      }),
      "markFailed",
    );

    return {
      ok: false,
      error: "FAILED",
      message: aiFailureMessage(
        error,
        "We couldn't analyze this application right now. Your AI allowance was not used. Please try again.",
      ),
    };
  }

  try {
    const analysis = await markAnalysisSucceeded({
      analysisId: pending.id,
      userId: input.userId,
      provider: providerResult.provider,
      model: providerResult.model,
      rawResponse: providerResult.rawResponse,
      resultJson: result,
      overallScore: result.scoring.overallScore,
      atsScore: result.scoring.atsScore,
      durationMs: providerResult.durationMs,
    });

    if (!analysis) {
      throw new Error("The analysis row could not be written");
    }

    await completeUsage({
      userId: input.userId,
      reservationId: reservation.reservationId,
      action,
      provider: providerResult.provider,
      model: providerResult.model,
      inputHash,
    });

    return {
      ok: true,
      analysisId: analysis.id,
      analysisPublicId: analysis.publicId,
      reused: false,
    };
  } catch (error) {
    const failureReason = `DatabaseFailure ${describeAiFailure(error)}`;

    console.error("Application analysis persistence failed", {
      stage: "PERSISTENCE",
      userId: input.userId,
      jobId: input.job.id,
      resumeVersionId: input.version.id,
      provider: providerResult.provider,
      model: providerResult.model,
      failureReason,
    });

    await settleUsage(
      failUsage({
        userId: input.userId,
        reservationId: reservation.reservationId,
        action,
        inputHash,
        failureReason,
      }),
      "fail",
    );

    await settleUsage(
      markAnalysisFailed({
        analysisId: pending.id,
        userId: input.userId,
        durationMs: Math.round(performance.now() - startedAt),
        failureReason,
      }),
      "markFailed",
    );

    return {
      ok: false,
      error: "FAILED",
      message:
        "The analysis finished but could not be saved. Your AI allowance was not used. Please try again.",
    };
  }
}

export async function getApplicationAnalysis(input: {
  userId: string;
  applicationId: string;
}) {
  const analysis = await findAnalysisForApplication(input);

  if (!analysis) {
    return null;
  }

  const [result, corrections] = await Promise.all([
    Promise.resolve(readStoredIntelligence(analysis)),
    listCorrectionsForAnalysis({
      userId: input.userId,
      analysisId: analysis.id,
    }),
  ]);

  return {
    analysis,
    result,
    requirements: result ? mergeCorrections(result, corrections) : [],
  };
}

export type ApplicationAnalysisView = NonNullable<
  Awaited<ReturnType<typeof getApplicationAnalysis>>
>;
