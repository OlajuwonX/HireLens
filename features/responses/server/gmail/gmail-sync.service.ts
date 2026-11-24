import "server-only";

import { createGmailApi, INBOX_QUERY } from "../../../../local-worker/src/gmail/client";
import { isRelevant } from "../../../../local-worker/src/gmail/filter";
import { refreshAccessToken } from "../../../../local-worker/src/gmail/oauth";
import { parseMessage } from "../../../../local-worker/src/gmail/parse";
import { openSecret } from "@/lib/crypto/secret-box";
import type { GmailConnection } from "@/lib/db/schema";
import { ATS_MAIL_DOMAINS, watchTerms } from "@/lib/responses/match";
import { inboundEmailSchema, MAX_EMAILS_PER_BATCH, type InboundEmail } from "../../schemas/email.schema";
import { existingMessageIds, listApplicationCandidates } from "../email.repository";
import { ingestEmails } from "../ingest.service";
import type { GmailClientConfig } from "./gmail-config";
import { recordGmailCheck } from "./gmail.repository";

const MAX_MESSAGES = 40;
const OVERLAP_SECONDS = 3_600;

export type GmailCheck = { ok: true; checked: number; stored: number } | { ok: false; reconnect: boolean; message: string };

export function inboxQuery(lastCheckedAt: Date | null) {
  return lastCheckedAt ? `${INBOX_QUERY} after:${Math.floor(lastCheckedAt.getTime() / 1000) - OVERLAP_SECONDS}` : INBOX_QUERY;
}

export function needsReconnect(message: string) {
  return /invalid_grant|unauthorized_client|unknown format|unsupported state|bad decrypt/i.test(message);
}

function toInbound(email: ReturnType<typeof parseMessage>): InboundEmail | null {
  const parsed = inboundEmailSchema.safeParse({ ...email, from: email.from.slice(0, 320), subject: email.subject.slice(0, 500) });

  return parsed.success ? parsed.data : null;
}

async function storeRelevant(userId: string, emails: InboundEmail[]) {
  let stored = 0;

  for (let start = 0; start < emails.length; start += MAX_EMAILS_PER_BATCH) {
    stored += (await ingestEmails({ userId, emails: emails.slice(start, start + MAX_EMAILS_PER_BATCH) })).stored;
  }

  return stored;
}

async function readInbox(connection: GmailConnection, config: GmailClientConfig, fetchImpl: typeof fetch) {
  const refreshToken = openSecret(connection.refreshTokenCipher, config.tokenKey);
  const accessToken = await refreshAccessToken({ clientId: config.clientId, clientSecret: config.clientSecret, refreshToken }, fetchImpl);
  const gmail = createGmailApi(async () => accessToken, fetchImpl);
  const ids = (await gmail.listIds(inboxQuery(connection.lastCheckedAt))).slice(0, MAX_MESSAGES);
  const seen = await existingMessageIds({ userId: connection.userId, messageIds: ids });
  const fresh = ids.filter((id) => !seen.has(id));
  const candidates = fresh.length > 0 ? await listApplicationCandidates(connection.userId) : [];
  const watch = { terms: watchTerms(candidates), domains: [...ATS_MAIL_DOMAINS] };
  const relevant: InboundEmail[] = [];

  for (const id of fresh) {
    const email = parseMessage(await gmail.get(id));
    const inbound = isRelevant(email, watch) ? toInbound(email) : null;

    if (inbound) relevant.push(inbound);
  }

  return { checked: fresh.length, relevant };
}

export async function checkGmailInbox(
  connection: GmailConnection,
  config: GmailClientConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<GmailCheck> {
  const startedAt = new Date();

  try {
    const inbox = await readInbox(connection, config, fetchImpl);
    const stored = await storeRelevant(connection.userId, inbox.relevant);

    await recordGmailCheck({ userId: connection.userId, status: "CONNECTED", lastError: null, checkedAt: startedAt });

    return { ok: true, checked: inbox.checked, stored };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail could not be read.";
    const reconnect = needsReconnect(message);

    await recordGmailCheck({
      userId: connection.userId,
      status: reconnect ? "NEEDS_RECONNECT" : "CONNECTED",
      lastError: message.slice(0, 500),
      checkedAt: null,
    });

    return { ok: false, reconnect, message };
  }
}
