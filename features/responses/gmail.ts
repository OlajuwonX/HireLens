export const GMAIL_STATE_COOKIE = "hirelens-gmail-oauth";
export const GMAIL_CONNECT_PATH = "/api/gmail/connect";
export const GMAIL_RESULT_PATH = "/dashboard/responses?gmail=";

export const GMAIL_RESULT_MESSAGES = {
  connected: "Gmail is connected. HireLens checks it every day, and you can check now at any time.",
  failed: "Gmail could not be connected. Try again, and allow HireLens to read your email on the Google screen.",
  unavailable: "Gmail is not set up on this HireLens server yet. See the user guide.",
} as const;

export type GmailResult = keyof typeof GMAIL_RESULT_MESSAGES;

export function readGmailResult(value: unknown): GmailResult | null {
  return typeof value === "string" && Object.hasOwn(GMAIL_RESULT_MESSAGES, value) ? (value as GmailResult) : null;
}

export function readPendingState(raw: string | undefined) {
  try {
    const parsed = JSON.parse(raw ?? "") as { state?: unknown; verifier?: unknown };

    return typeof parsed.state === "string" && typeof parsed.verifier === "string"
      ? { state: parsed.state, verifier: parsed.verifier }
      : null;
  } catch {
    return null;
  }
}
