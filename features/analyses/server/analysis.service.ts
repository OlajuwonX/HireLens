import "server-only";

import {
  MockResumeAIProvider,
  RESUME_ANALYSIS_PROMPT_VERSION,
  hashAnalysisInput,
  normalizeJsonModelOutput,
  type ResumeAIProvider,
} from "@/lib/ai";
import { generalResumeAnalysisSchema } from "@/lib/ai/schemas/resume-analysis.schema";
import { getOwnedResumeVersion } from "@/features/resumes/server/resume-version.service";
import {
  createAnalysisSuggestions,
  createPendingAnalysis,
  findAnalysisForUser,
  listAnalysesForResumeVersion,
  markAnalysisFailed,
  markAnalysisSucceeded,
} from "./analysis.repository";

const defaultProvider = new MockResumeAIProvider();

export async function runGeneralResumeAnalysis(input: {
  userId: string;
  versionPublicId: string;
  provider?: ResumeAIProvider;
}) {
  const version = await getOwnedResumeVersion({
    userId: input.userId,
    versionPublicId: input.versionPublicId,
  });

  if (!version) {
    return null;
  }

  const provider = input.provider ?? defaultProvider;
  const analysisInput = {
    type: "GENERAL" as const,
    promptVersion: RESUME_ANALYSIS_PROMPT_VERSION,
    resumeVersionId: version.id,
    extractedText: version.extractedText,
  };
  const inputHash = await hashAnalysisInput(analysisInput);
  const pendingAnalysis = await createPendingAnalysis({
    userId: input.userId,
    resumeVersionId: version.id,
    type: "GENERAL",
    provider: "mock",
    model: "pending",
    promptVersion: RESUME_ANALYSIS_PROMPT_VERSION,
    inputHash,
  });

  const startedAt = performance.now();

  try {
    const providerResult = await provider.analyzeResume({
      resumeText: version.extractedText,
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
