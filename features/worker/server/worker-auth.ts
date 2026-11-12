import "server-only";

import { getAccountRecord } from "@/features/auth/server/current-account";
import { isRateLimited } from "@/lib/rate-limit";
import { hashWorkerToken, readBearer } from "../token";
import { findActiveToken, touchWorkerToken } from "./token.repository";

export type WorkerIdentity = { userId: string; workerId: string };

export async function authenticateWorker(request: Request): Promise<WorkerIdentity | null> {
  const token = readBearer(request.headers.get("authorization"));

  if (!token) {
    return null;
  }

  const tokenHash = hashWorkerToken(token);

  if (await isRateLimited("workerToken", tokenHash)) {
    return null;
  }

  const row = await findActiveToken(tokenHash);
  const account = row ? await getAccountRecord(row.userId) : null;

  if (!row || !account || account.disabledAt || account.deletedAt) {
    return null;
  }

  await touchWorkerToken(row.id);

  return { userId: row.userId, workerId: row.publicId };
}
