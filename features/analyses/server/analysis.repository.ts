import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applicationAnalyses,
  userEvidenceCorrections,
  type NewApplicationAnalysis,
} from "@/lib/db/schema";

export async function findAnalysisByInputHash(input: {
  userId: string;
  inputHash: string;
}) {
  const [analysis] = await db
    .select()
    .from(applicationAnalyses)
    .where(
      and(
        eq(applicationAnalyses.userId, input.userId),
        eq(applicationAnalyses.inputHash, input.inputHash),
      ),
    )
    .limit(1);

  return analysis ?? null;
}

export async function findAnalysisById(input: {
  userId: string;
  analysisId: string;
}) {
  const [analysis] = await db
    .select()
    .from(applicationAnalyses)
    .where(
      and(
        eq(applicationAnalyses.userId, input.userId),
        eq(applicationAnalyses.id, input.analysisId),
      ),
    )
    .limit(1);

  return analysis ?? null;
}

export async function findAnalysisForApplication(input: {
  userId: string;
  applicationId: string;
}) {
  const [analysis] = await db
    .select()
    .from(applicationAnalyses)
    .where(
      and(
        eq(applicationAnalyses.userId, input.userId),
        eq(applicationAnalyses.applicationId, input.applicationId),
      ),
    )
    .orderBy(desc(applicationAnalyses.createdAt))
    .limit(1);

  return analysis ?? null;
}

export async function createPendingAnalysis(input: NewApplicationAnalysis) {
  const [analysis] = await db
    .insert(applicationAnalyses)
    .values(input)
    .returning();

  return analysis;
}

export async function resetAnalysisToPending(input: {
  analysisId: string;
  userId: string;
  promptVersion: string;
}) {
  const [analysis] = await db
    .update(applicationAnalyses)
    .set({
      status: "PENDING",
      promptVersion: input.promptVersion,
      failureReason: null,
      rawResponse: null,
      resultJson: null,
      overallScore: null,
      atsScore: null,
      durationMs: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(applicationAnalyses.id, input.analysisId),
        eq(applicationAnalyses.userId, input.userId),
      ),
    )
    .returning();

  return analysis ?? null;
}

export async function markAnalysisSucceeded(input: {
  analysisId: string;
  userId: string;
  provider: string;
  model: string;
  rawResponse: unknown;
  resultJson: unknown;
  overallScore: number;
  atsScore: number;
  durationMs: number;
}) {
  const [analysis] = await db
    .update(applicationAnalyses)
    .set({
      status: "SUCCEEDED",
      provider: input.provider,
      model: input.model,
      rawResponse: input.rawResponse,
      resultJson: input.resultJson,
      overallScore: input.overallScore,
      atsScore: input.atsScore,
      durationMs: input.durationMs,
      failureReason: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(applicationAnalyses.id, input.analysisId),
        eq(applicationAnalyses.userId, input.userId),
      ),
    )
    .returning();

  return analysis ?? null;
}

export async function markAnalysisFailed(input: {
  analysisId: string;
  userId: string;
  durationMs?: number;
  failureReason: string;
}) {
  const [analysis] = await db
    .update(applicationAnalyses)
    .set({
      status: "FAILED",
      durationMs: input.durationMs,
      failureReason: input.failureReason,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(applicationAnalyses.id, input.analysisId),
        eq(applicationAnalyses.userId, input.userId),
      ),
    )
    .returning();

  return analysis ?? null;
}

export async function attachAnalysisApplication(input: {
  userId: string;
  analysisId: string;
  applicationId: string;
}) {
  await db
    .update(applicationAnalyses)
    .set({ applicationId: input.applicationId, updatedAt: new Date() })
    .where(
      and(
        eq(applicationAnalyses.userId, input.userId),
        eq(applicationAnalyses.id, input.analysisId),
      ),
    );
}

export async function listCorrectionsForAnalysis(input: {
  userId: string;
  analysisId: string;
}) {
  return db
    .select()
    .from(userEvidenceCorrections)
    .where(
      and(
        eq(userEvidenceCorrections.userId, input.userId),
        eq(userEvidenceCorrections.analysisId, input.analysisId),
      ),
    );
}

export async function upsertEvidenceCorrection(input: {
  userId: string;
  analysisId: string;
  requirementKey: string;
  requirement: string;
  markedIncorrect: boolean;
  evidence: string | null;
  notes: string | null;
}) {
  const [correction] = await db
    .insert(userEvidenceCorrections)
    .values(input)
    .onConflictDoUpdate({
      target: [
        userEvidenceCorrections.analysisId,
        userEvidenceCorrections.requirementKey,
      ],
      set: {
        requirement: input.requirement,
        markedIncorrect: input.markedIncorrect,
        evidence: input.evidence,
        notes: input.notes,
        updatedAt: new Date(),
      },
    })
    .returning();

  return correction;
}

export async function deleteEvidenceCorrection(input: {
  userId: string;
  analysisId: string;
  requirementKey: string;
}) {
  await db
    .delete(userEvidenceCorrections)
    .where(
      and(
        eq(userEvidenceCorrections.userId, input.userId),
        eq(userEvidenceCorrections.analysisId, input.analysisId),
        eq(userEvidenceCorrections.requirementKey, input.requirementKey),
      ),
    );
}
