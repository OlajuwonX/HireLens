import "server-only";

import { readStoredIntelligence } from "@/features/analyses/server/analysis.mapper";
import { findAnalysisForApplication } from "@/features/analyses/server/analysis.repository";
import { findTaskForUser } from "@/features/auto-apply/server/task.repository";
import type { ApplicationTask } from "@/lib/db/schema";
import { loadCandidateFacts } from "./candidate-facts";

export async function loadIntelligence(input: { userId: string; applicationId: string }) {
  const analysis = await findAnalysisForApplication(input);

  return analysis ? readStoredIntelligence(analysis) : null;
}

export async function buildTaskPayload(userId: string, task: ApplicationTask) {
  const [facts, intelligence, row] = await Promise.all([
    loadCandidateFacts(userId),
    loadIntelligence({ userId, applicationId: task.applicationId }),
    findTaskForUser({ userId, publicId: task.publicId }),
  ]);

  return {
    task: { id: task.publicId, platform: task.platform, url: row?.sourceUrl ?? null },
    job: { title: row?.title ?? "", company: row?.company ?? "" },
    ...facts,
    coverLetter: intelligence?.coverLetter || null,
    resumePath: `/api/worker/tasks/${task.publicId}/resume`,
  };
}

export type TaskPayload = Awaited<ReturnType<typeof buildTaskPayload>>;
