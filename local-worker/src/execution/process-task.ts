import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { HireLensApi } from "../communication/api";
import type { TaskPayload, WorkerResult } from "../contract";
import { providers } from "../providers";
import { runTask, type RunOptions } from "./run-task";
import type { FormSession } from "./session";

export const HEARTBEAT_MS = 60_000;

const manual = (payload: TaskPayload, reason: string): WorkerResult => ({
  taskId: payload.task.id,
  outcome: "NEEDS_MANUAL_ACTION",
  reason,
  missing: [],
});

export async function processTask(input: {
  payload: TaskPayload;
  api: HireLensApi;
  openSession: (url: string, resumeFile: string, provider: (typeof providers)[string]) => Promise<FormSession>;
  options: RunOptions;
  workDir?: string;
}): Promise<WorkerResult> {
  const { payload, api } = input;
  const provider = payload.task.platform ? providers[payload.task.platform] : undefined;

  if (!provider || !payload.task.url) {
    const result = manual(payload, "This site is not supported by the local worker yet. Apply with the job link.");
    await api.report(result);
    return result;
  }

  const dir = join(input.workDir ?? process.cwd(), ".downloads");
  const resumeFile = join(dir, `${payload.task.id}.pdf`);
  const beat = setInterval(() => void api.heartbeat(payload.task.id).catch(() => false), HEARTBEAT_MS);
  let session: FormSession | null = null;
  let result: WorkerResult;

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(resumeFile, await api.downloadResume(payload.resumePath));
    session = await input.openSession(provider.applyUrl(payload.task.url), resumeFile, provider);
    result = { taskId: payload.task.id, ...(await runTask(payload, session, input.options)) };
  } catch (error) {
    const reason = error instanceof Error ? error.message.split("\n")[0].slice(0, 300) : "Unknown error";

    result = session?.submitAttempted()
      ? { taskId: payload.task.id, outcome: "UNCONFIRMED", reason: `The worker stopped after submitting: ${reason}`, missing: [] }
      : { taskId: payload.task.id, outcome: "FAILED", reason: `The worker stopped before submitting: ${reason}`, missing: [] };
  } finally {
    clearInterval(beat);
    await rm(resumeFile, { force: true });
  }

  if (result.outcome === "SUBMITTED") {
    await session?.close();
  }

  await api.report(result);

  return result;
}
