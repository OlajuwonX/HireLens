import * as Sentry from "@sentry/nextjs";
import { getServerEnv } from "@/lib/env/server";
import {
  pruneErrorEventsOlderThan,
  upsertErrorEvent,
} from "@/features/admin/server/error-events.repository";
import {
  mapSentryIssuePayload,
  verifySentrySignature,
} from "@/features/admin/server/error-webhook.service";

export const dynamic = "force-dynamic";

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const secret = getServerEnv().SENTRY_WEBHOOK_SECRET;

  if (!secret) {
    return new Response("Not configured", { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("sentry-hook-signature");

  if (!verifySentrySignature(rawBody, signature, secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let json: unknown;

  try {
    json = JSON.parse(rawBody);
  } catch {
    return Response.json({ ok: true });
  }

  const event = mapSentryIssuePayload(json);

  if (!event) {
    return Response.json({ ok: true });
  }

  try {
    await upsertErrorEvent(event);
    await pruneErrorEventsOlderThan(new Date(Date.now() - RETENTION_MS));
  } catch (error) {
    Sentry.captureException(error, {
      tags: { source: "sentry-webhook-ingest" },
    });
  }

  return Response.json({ ok: true });
}
