import * as Sentry from "@sentry/nextjs";
import {
  scrubEvent,
  sentryBaseOptions,
} from "@/lib/observability/sentry-options";

Sentry.init({
  ...sentryBaseOptions,
  beforeSend: scrubEvent,
});
