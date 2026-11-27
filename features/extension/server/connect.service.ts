import "server-only";

import { revokeWorkerTokensNamed } from "@/features/worker/server/token.repository";
import { createWorkerToken } from "@/features/worker/server/token.service";
import { EXTENSION_TOKEN_NAME } from "../constants";

export type ConnectResult =
  | { ok: true; token: string; bypass: string | null }
  | { ok: false; message: string };

export async function connectExtension(userId: string): Promise<ConnectResult> {
  await revokeWorkerTokensNamed({ userId, name: EXTENSION_TOKEN_NAME });

  const created = await createWorkerToken({ userId, name: EXTENSION_TOKEN_NAME });

  return created.ok
    ? { ok: true, token: created.token, bypass: process.env.VERCEL_AUTOMATION_BYPASS_SECRET || null }
    : created;
}
