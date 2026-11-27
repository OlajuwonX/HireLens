import "server-only";

import {
  findApplicationRowForUser,
  promoteSavedApplication,
  type ApplicationRow,
} from "@/features/applications/server/application.repository";
import { analyzeOwnedApplication, ensureApplicationAnalysis } from "@/features/applications/server/application.service";
import { loadIntelligence } from "@/features/worker/server/task-payload";
import type { WorkerIdentity } from "@/features/worker/server/worker-auth";
import { boostFinished, nextBoostStep } from "../match";

const GAP_LIMIT = 5;

export type BoostResult =
  | { ok: true; score: number | null; previousScore: number | null; finished: boolean; gaps: string[] }
  | { ok: false; limited: boolean; message: string };

type StepOutcome = { ok: true; stuck: boolean } | { ok: false; limited: boolean; message: string };

const isAnalyzed = (row: ApplicationRow) => Boolean(row.application.analysisId && row.analysisPublicId);

async function analyzeFirst(userId: string, publicId: string): Promise<StepOutcome> {
  const result = await ensureApplicationAnalysis({ userId, publicId });

  return result.ok ? { ok: true, stuck: false } : result;
}

async function refine(userId: string, row: ApplicationRow): Promise<StepOutcome> {
  if (row.application.saveOnly) {
    await promoteSavedApplication({ userId, applicationId: row.application.id });
  }

  const result = await analyzeOwnedApplication({ userId, publicId: row.application.publicId });

  if (!result.ok) {
    return { ok: false, limited: result.error === "LIMIT_REACHED", message: result.message };
  }

  return { ok: true, stuck: result.value.optimization === "ALREADY_OPTIMIZED" || result.value.optimization === "KEPT_PREVIOUS" };
}

async function loadGaps(userId: string, applicationId: string) {
  const intelligence = await loadIntelligence({ userId, applicationId });

  return (intelligence?.requirementMatches ?? [])
    .filter((match) => match.status === "MISSING" && match.importance === "REQUIRED")
    .map((match) => match.requirement)
    .slice(0, GAP_LIMIT);
}

export async function boostApplication(worker: WorkerIdentity, publicId: string): Promise<BoostResult> {
  const userId = worker.userId;
  const row = await findApplicationRowForUser({ userId, publicId });

  if (!row) {
    return { ok: false, limited: false, message: "That job is not in your HireLens account." };
  }

  const previousScore = isAnalyzed(row) ? row.matchScore : null;
  const step = nextBoostStep({ analyzed: isAnalyzed(row), score: row.matchScore });
  const outcome: StepOutcome =
    step === "done" ? { ok: true, stuck: true } : step === "analyze" ? await analyzeFirst(userId, publicId) : await refine(userId, row);

  if (!outcome.ok) {
    return outcome;
  }

  const after = step === "done" ? row : await findApplicationRowForUser({ userId, publicId });
  const score = after?.matchScore ?? null;

  return {
    ok: true,
    score,
    previousScore,
    finished: boostFinished({ score, previous: previousScore, stuck: outcome.stuck }),
    gaps: after ? await loadGaps(userId, after.application.id) : [],
  };
}
