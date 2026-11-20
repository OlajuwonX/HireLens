import "server-only";

import { findApplicationRowForUser } from "@/features/applications/server/application.repository";
import { findFileAssetById } from "@/features/files/server/file-asset.repository";
import { getOwnedResumeVersion } from "@/features/resumes/server/resume-version.service";
import { submissionsRemaining } from "@/lib/auto-apply/policy";
import { renderImprovedResumePdf } from "@/lib/pdf/resume-document";
import { getStorageProvider } from "@/lib/storage/provider";
import { countSubmittedToday, findTaskForUser } from "@/features/auto-apply/server/task.repository";
import { resultToState, type WorkerResult } from "../contract";
import { claimApprovedTask, extendLease, finishLease, reconcileExpiredLeases } from "./lease.repository";
import { buildTaskPayload, loadIntelligence } from "./task-payload";
import type { WorkerIdentity } from "./worker-auth";

export async function claimNextTask(worker: WorkerIdentity) {
  await reconcileExpiredLeases(worker.userId);

  if (submissionsRemaining(await countSubmittedToday(worker.userId)) === 0) {
    return { task: null, reason: "DAILY_LIMIT" as const };
  }

  const task = await claimApprovedTask(worker);

  return task ? { task: await buildTaskPayload(worker.userId, task) } : { task: null, reason: "EMPTY" as const };
}

export async function heartbeat(worker: WorkerIdentity, publicId: string) {
  return extendLease({ ...worker, publicId });
}

export async function reportResult(worker: WorkerIdentity, result: WorkerResult) {
  const { to, reason } = resultToState(result);

  return finishLease({
    ...worker,
    publicId: result.taskId,
    to,
    reason,
    needs: result.missing,
    confirmation: result.evidence ? { method: "WORKER", ...result.evidence, at: new Date().toISOString() } : null,
  });
}

export async function loadTaskResume(worker: WorkerIdentity, publicId: string) {
  const task = await findTaskForUser({ userId: worker.userId, publicId });
  const row = task
    ? await findApplicationRowForUser({ userId: worker.userId, publicId: task.applicationPublicId })
    : null;

  if (!task || !row || task.state !== "SUBMITTING") {
    return null;
  }

  const intelligence = await loadIntelligence({ userId: worker.userId, applicationId: row.application.id });

  if (intelligence && intelligence.improvedResume.experience.length > 0) {
    return renderImprovedResumePdf(intelligence.improvedResume);
  }

  const version = row.versionPublicId
    ? await getOwnedResumeVersion({ userId: worker.userId, versionPublicId: row.versionPublicId })
    : null;
  const asset = version ? await findFileAssetById({ userId: worker.userId, id: version.fileAssetId }) : null;

  return asset && !asset.deletedAt ? getStorageProvider().readFile(asset.storageKey) : null;
}
