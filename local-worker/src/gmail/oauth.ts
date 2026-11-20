import { createHash, randomBytes } from "node:crypto";
import { chmod, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const TOKEN_FILE = join(process.cwd(), ".gmail-token.json");

export type GmailClient = { clientId: string; clientSecret?: string };

export function createPkce() {
  const verifier = randomBytes(48).toString("base64url");

  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}

export function buildAuthUrl(input: { clientId: string; redirectUri: string; challenge: string; state: string }) {
  const url = new URL(AUTH_URL);

  url.search = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPE,
    access_type: "offline",
    prompt: "consent",
    code_challenge: input.challenge,
    code_challenge_method: "S256",
    state: input.state,
  }).toString();

  return url.toString();
}

async function tokenRequest(params: Record<string, string>, fetchImpl: typeof fetch) {
  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const body = (await response.json()) as { access_token?: string; refresh_token?: string; error?: string };

  if (!response.ok || !body.access_token) {
    throw new Error(`Google refused the request: ${body.error ?? response.status}`);
  }

  return body;
}

export async function exchangeCode(
  input: GmailClient & { code: string; verifier: string; redirectUri: string },
  fetchImpl: typeof fetch = fetch,
) {
  return tokenRequest(
    {
      client_id: input.clientId,
      ...(input.clientSecret ? { client_secret: input.clientSecret } : {}),
      code: input.code,
      code_verifier: input.verifier,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri,
    },
    fetchImpl,
  );
}

export async function refreshAccessToken(input: GmailClient & { refreshToken: string }, fetchImpl: typeof fetch = fetch) {
  const body = await tokenRequest(
    {
      client_id: input.clientId,
      ...(input.clientSecret ? { client_secret: input.clientSecret } : {}),
      refresh_token: input.refreshToken,
      grant_type: "refresh_token",
    },
    fetchImpl,
  );

  return body.access_token as string;
}

export async function saveRefreshToken(refreshToken: string, file = TOKEN_FILE) {
  await writeFile(file, JSON.stringify({ refreshToken }), "utf8");
  await chmod(file, 0o600).catch(() => undefined);
}

export async function loadRefreshToken(file = TOKEN_FILE) {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as { refreshToken?: unknown };

    return typeof parsed.refreshToken === "string" ? parsed.refreshToken : null;
  } catch {
    return null;
  }
}
