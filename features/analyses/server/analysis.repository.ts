import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  resumeAnalyses,
  analysisSuggestions,
  type ResumeAnalysis,
} from "@/lib/db/schema";

export async function createPendingAnalysis(input: {
  userId: string;
  resumeVersionId: string;
  jobId?: string | null;
  type: ResumeAnalysis["type"];
  provider: string;
  model: string;
  promptVersion: string;
  inputHash: string;
}) {
  const [analysis] = await db.insert(resumeAnalyses).values(input).returning();
  return analysis;
}

export async function markAnalysisSucceeded(input: {
  analysisId: string;
  userId: string;
  provider: string;
  model: string;
  rawResponse: unknown;
  normalizedResult: unknown;
  overallScore: number;
  atsScore: number;
  durationMs: number;
}) {
  const [analysis] = await db
    .update(resumeAnalyses)
    .set({
      status: "SUCCEEDED",
      provider: input.provider,
      model: input.model,
      rawResponse: input.rawResponse,
      normalizedResult: input.normalizedResult,
      overallScore: input.overallScore,
      atsScore: input.atsScore,
      durationMs: input.durationMs,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(resumeAnalyses.id, input.analysisId),
        eq(resumeAnalyses.userId, input.userId),
      ),
    )
    .returning();

  return analysis ?? null;
}

export async function markAnalysisFailed(input: {
  analysisId: string;
  userId: string;
  provider?: string;
  model?: string;
  rawResponse?: unknown;
  durationMs?: number;
  failureReason: string;
}) {
  const [analysis] = await db
    .update(resumeAnalyses)
    .set({
      status: "FAILED",
      provider: input.provider,
      model: input.model,
      rawResponse: input.rawResponse,
      durationMs: input.durationMs,
      failureReason: input.failureReason,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(resumeAnalyses.id, input.analysisId),
        eq(resumeAnalyses.userId, input.userId),
      ),
    )
    .returning();

  return analysis ?? null;
}

export async function listAnalysesForResumeVersion(input: {
  userId: string;
  resumeVersionId: string;
}) {
  return db
    .select()
    .from(resumeAnalyses)
    .where(
      and(
        eq(resumeAnalyses.userId, input.userId),
        eq(resumeAnalyses.resumeVersionId, input.resumeVersionId),
      ),
    )
    .orderBy(desc(resumeAnalyses.createdAt));
}

export async function findAnalysisForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [analysis] = await db
    .select()
    .from(resumeAnalyses)
    .where(
      and(
        eq(resumeAnalyses.userId, input.userId),
        eq(resumeAnalyses.publicId, input.publicId),
      ),
    )
    .limit(1);

  return analysis ?? null;
}

export async function createAnalysisSuggestions(input: {
  userId: string;
  analysisId: string;
  recommendations: {
    category: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    problem: string;
    reason: string;
    action: string;
  }[];
}) {
  if (input.recommendations.length === 0) {
    return [];
  }

  return db
    .insert(analysisSuggestions)
    .values(
      input.recommendations.map((recommendation) => ({
        userId: input.userId,
        analysisId: input.analysisId,
        ...recommendation,
      })),
    )
    .returning();
}
