import "server-only";

import { findApplicationRowForUser } from "@/features/applications/server/application.repository";
import { listSavedJobRefs } from "@/features/discovery/server/feed.repository";
import { loadCandidateFacts } from "@/features/worker/server/candidate-facts";
import { loadApplicationResume, loadDefaultResume } from "@/features/worker/server/resume-file";
import { loadIntelligence } from "@/features/worker/server/task-payload";
import { renderCoverLetterPdf } from "@/lib/pdf/cover-letter-document";
import type { WorkerIdentity } from "@/features/worker/server/worker-auth";
import { samePage } from "../page-key";

async function findSavedApplication(userId: string, url: string) {
  const match = (await listSavedJobRefs(userId)).find((ref) => samePage(ref.sourceUrl, url));

  return match ? findApplicationRowForUser({ userId, publicId: match.applicationPublicId }) : null;
}

export async function buildFillData(worker: WorkerIdentity, url: string) {
  const [facts, row] = await Promise.all([loadCandidateFacts(worker.userId), findSavedApplication(worker.userId, url)]);
  const intelligence = row ? await loadIntelligence({ userId: worker.userId, applicationId: row.application.id }) : null;
  const publicId = row?.application.publicId ?? null;

  const coverLetter = intelligence?.coverLetter || null;

  return {
    application: row ? { publicId: row.application.publicId, title: row.job.title, company: row.job.company } : null,
    ...facts,
    coverLetter,
    coverLetterPath: publicId && coverLetter ? `/api/extension/cover-letter?application=${publicId}` : null,
    match: { score: row?.application.analysisId ? row.matchScore : null, analyzed: Boolean(row?.application.analysisId) },
    resume: {
      path: publicId ? `/api/extension/resume?application=${publicId}` : "/api/extension/resume",
      tailored: Boolean(intelligence && intelligence.improvedResume.experience.length > 0),
    },
  };
}

export type FillData = Awaited<ReturnType<typeof buildFillData>>;

export async function loadExtensionResume(worker: WorkerIdentity, applicationPublicId?: string) {
  const row = applicationPublicId
    ? await findApplicationRowForUser({ userId: worker.userId, publicId: applicationPublicId })
    : null;

  return row ? loadApplicationResume(worker.userId, row) : loadDefaultResume(worker.userId);
}

export async function loadExtensionCoverLetter(worker: WorkerIdentity, applicationPublicId: string) {
  const row = await findApplicationRowForUser({ userId: worker.userId, publicId: applicationPublicId });
  const intelligence = row ? await loadIntelligence({ userId: worker.userId, applicationId: row.application.id }) : null;

  return intelligence?.coverLetter ? renderCoverLetterPdf(intelligence.coverLetter) : null;
}
