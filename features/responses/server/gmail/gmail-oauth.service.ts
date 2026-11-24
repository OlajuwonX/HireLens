import "server-only";

import { randomBytes } from "node:crypto";
import { buildAuthUrl, createPkce, exchangeCode, GMAIL_SCOPE } from "../../../../local-worker/src/gmail/oauth";
import { sealSecret } from "@/lib/crypto/secret-box";
import { GMAIL_CALLBACK_PATH, type GmailClientConfig } from "./gmail-config";
import { saveGmailConnection } from "./gmail.repository";

export type GmailOAuthState = { state: string; verifier: string };

export function startGmailConnect(config: GmailClientConfig, origin: string) {
  const { verifier, challenge } = createPkce();
  const state = randomBytes(16).toString("hex");
  const url = buildAuthUrl({ clientId: config.clientId, redirectUri: `${origin}${GMAIL_CALLBACK_PATH}`, challenge, state });

  return { url, pending: { state, verifier } satisfies GmailOAuthState };
}

export async function finishGmailConnect(
  input: { userId: string; config: GmailClientConfig; origin: string; code: string; verifier: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const tokens = (await exchangeCode(
      {
        clientId: input.config.clientId,
        clientSecret: input.config.clientSecret,
        code: input.code,
        verifier: input.verifier,
        redirectUri: `${input.origin}${GMAIL_CALLBACK_PATH}`,
      },
      fetchImpl,
    )) as { refresh_token?: string; scope?: string };

    if (tokens.scope && !tokens.scope.split(" ").includes(GMAIL_SCOPE)) {
      return { ok: false, message: "Allow HireLens to read your Gmail on the Google screen, then try again." };
    }

    if (!tokens.refresh_token) {
      return { ok: false, message: "Google did not give lasting access. Remove HireLens from your Google account's third-party access, then connect again." };
    }

    await saveGmailConnection({ userId: input.userId, refreshTokenCipher: sealSecret(tokens.refresh_token, input.config.tokenKey) });

    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Gmail could not be connected." };
  }
}
