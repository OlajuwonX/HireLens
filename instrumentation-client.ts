import {
  scrubEvent,
  sentryBaseOptions,
} from "@/lib/observability/sentry-options";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  ...sentryBaseOptions,
  beforeSend: scrubEvent,
  integrations: [],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
