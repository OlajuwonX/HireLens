import "server-only";

import { openSecret } from "@/lib/crypto/secret-box";
import { gmailClient } from "./gmail-config";
import { deleteGmailConnection, findGmailConnection, listActiveGmailConnections } from "./gmail.repository";
import { checkGmailInbox, type GmailCheck } from "./gmail-sync.service";

const RUN_BUDGET_MS = 240_000;
const RECHECK_AFTER_MS = 60_000;
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export type GmailRunReport = { users: number; checked: number; stored: number; failed: number; skipped: boolean };

export async function runGmailChecks(now = Date.now()): Promise<GmailRunReport> {
  const config = gmailClient();
  const report: GmailRunReport = { users: 0, checked: 0, stored: 0, failed: 0, skipped: !config };

  if (!config) {
    return report;
  }

  for (const connection of await listActiveGmailConnections()) {
    if (Date.now() - now > RUN_BUDGET_MS) break;

    const result = await checkGmailInbox(connection, config);

    report.users += 1;
    report.checked += result.ok ? result.checked : 0;
    report.stored += result.ok ? result.stored : 0;
    report.failed += result.ok ? 0 : 1;
  }

  return report;
}

export async function checkGmailNow(userId: string): Promise<GmailCheck> {
  const config = gmailClient();
  const connection = await findGmailConnection(userId);

  if (!config || !connection) {
    return { ok: false, reconnect: true, message: "Connect Gmail first." };
  }

  if (connection.lastCheckedAt && Date.now() - connection.lastCheckedAt.getTime() < RECHECK_AFTER_MS) {
    return { ok: true, checked: 0, stored: 0 };
  }

  return checkGmailInbox(connection, config);
}

export async function disconnectGmail(userId: string, fetchImpl: typeof fetch = fetch) {
  const removed = await deleteGmailConnection(userId);
  const config = gmailClient();

  if (!removed || !config) {
    return;
  }

  try {
    await fetchImpl(REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: openSecret(removed.refreshTokenCipher, config.tokenKey) }),
    });
  } catch {
    return;
  }
}
