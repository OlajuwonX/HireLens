import type { ErrorEvent, EventHint } from "@sentry/nextjs";
import { scrubValue } from "./scrub";

const ALLOWED_HEADERS = new Set([
  "accept",
  "accept-language",
  "content-type",
  "referer",
  "user-agent",
]);

export const SENTRY_ENABLED = process.env.NODE_ENV === "production";

export const sentryBaseOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: SENTRY_ENABLED,
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
};

export function scrubEvent(
  event: ErrorEvent,
  _hint: EventHint,
): ErrorEvent | null {
  if (event.request) {
    const { url, method, headers } = event.request;
    const safeHeaders: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers ?? {})) {
      if (ALLOWED_HEADERS.has(key.toLowerCase()) && typeof value === "string") {
        safeHeaders[key] = value;
      }
    }

    event.request = {
      url: url?.split("?")[0],
      method,
      headers: safeHeaders,
    };
  }

  if (event.extra) {
    event.extra = scrubValue(event.extra) as Record<string, unknown>;
  }

  if (event.contexts) {
    event.contexts = scrubValue(event.contexts) as typeof event.contexts;
  }

  if (event.user) {
    event.user = { id: event.user.id };
  }

  event.breadcrumbs = event.breadcrumbs?.map((crumb) => ({
    ...crumb,
    data: crumb.data
      ? (scrubValue(crumb.data) as Record<string, unknown>)
      : undefined,
  }));

  return event;
}
