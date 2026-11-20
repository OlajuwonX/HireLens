import "server-only";

import { generateWorkerToken } from "../token";
import { insertWorkerToken, listWorkerTokens } from "./token.repository";

export const MAX_WORKER_TOKENS = 5;

export type CreateTokenResult = { ok: true; token: string } | { ok: false; message: string };

export async function createWorkerToken(input: { userId: string; name: string }): Promise<CreateTokenResult> {
  const existing = await listWorkerTokens(input.userId);

  if (existing.length >= MAX_WORKER_TOKENS) {
    return { ok: false, message: `You can keep up to ${MAX_WORKER_TOKENS} worker tokens. Revoke one first.` };
  }

  const { token, hash } = generateWorkerToken();
  await insertWorkerToken({ userId: input.userId, name: input.name, tokenHash: hash });

  return { ok: true, token };
}
