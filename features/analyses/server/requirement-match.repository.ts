import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  requirementMatches,
  resumeAnalyses,
  userEvidenceCorrections,
} from "@/lib/db/schema";
import type { JobFitAnalysis } from "@/lib/ai/schemas/job-fit-analysis.schema";

export async function replaceRequirementMatches(input: {
  userId: string;
  analysisId: string;
  matches: JobFitAnalysis["requirementMatches"];
}) {
  return db.transaction(async (tx) => {
    await tx
      .delete(requirementMatches)
      .where(
        and(
          eq(requirementMatches.userId, input.userId),
          eq(requirementMatches.analysisId, input.analysisId),
        ),
      );

    if (input.matches.length === 0) {
      return [];
    }

    return tx
      .insert(requirementMatches)
      .values(
        input.matches.map((match) => ({
          userId: input.userId,
          analysisId: input.analysisId,
          requirement: match.requirement,
          category: match.category,
          importance: match.importance,
          status: match.status,
          resumeEvidence: match.resumeEvidence,
          explanation: match.explanation,
          recommendation: match.recommendation,
        })),
      )
      .returning();
  });
}

export async function listRequirementMatchesForAnalysis(input: {
  userId: string;
  analysisId: string;
}) {
  return db
    .select({
      match: requirementMatches,
      correction: userEvidenceCorrections,
    })
    .from(requirementMatches)
    .leftJoin(
      userEvidenceCorrections,
      eq(userEvidenceCorrections.requirementMatchId, requirementMatches.id),
    )
    .where(
      and(
        eq(requirementMatches.userId, input.userId),
        eq(requirementMatches.analysisId, input.analysisId),
      ),
    )
    .orderBy(asc(requirementMatches.importance), asc(requirementMatches.createdAt));
}

export async function findRequirementMatchForUser(input: {
  userId: string;
  matchId: string;
}) {
  const [match] = await db
    .select()
    .from(requirementMatches)
    .where(
      and(
        eq(requirementMatches.userId, input.userId),
        eq(requirementMatches.id, input.matchId),
      ),
    )
    .limit(1);

  return match ?? null;
}

export async function listCorrectionsForResumeVersion(input: {
  userId: string;
  resumeVersionId: string;
}) {
  return db
    .select({
      requirement: requirementMatches.requirement,
      markedIncorrect: userEvidenceCorrections.markedIncorrect,
      evidence: userEvidenceCorrections.evidence,
      notes: userEvidenceCorrections.notes,
      updatedAt: userEvidenceCorrections.updatedAt,
    })
    .from(userEvidenceCorrections)
    .innerJoin(
      requirementMatches,
      eq(requirementMatches.id, userEvidenceCorrections.requirementMatchId),
    )
    .innerJoin(
      resumeAnalyses,
      eq(resumeAnalyses.id, requirementMatches.analysisId),
    )
    .where(
      and(
        eq(userEvidenceCorrections.userId, input.userId),
        eq(resumeAnalyses.resumeVersionId, input.resumeVersionId),
      ),
    )
    .orderBy(asc(requirementMatches.requirement));
}
