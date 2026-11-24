import "server-only";

import { getServerEnv } from "@/lib/env/server";

export const GMAIL_CALLBACK_PATH = "/api/gmail/callback";

export function gmailClient() {
  const env = getServerEnv();
  const clientId = env.GMAIL_CLIENT_ID ?? env.AUTH_GOOGLE_ID;
  const clientSecret = env.GMAIL_CLIENT_ID ? env.GMAIL_CLIENT_SECRET : env.AUTH_GOOGLE_SECRET;
  const tokenKey = env.GMAIL_TOKEN_KEY ?? env.AUTH_SECRET;

  return clientId && clientSecret && tokenKey ? { clientId, clientSecret, tokenKey } : null;
}

export type GmailClientConfig = NonNullable<ReturnType<typeof gmailClient>>;
