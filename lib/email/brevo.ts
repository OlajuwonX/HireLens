import "server-only";

import { getServerEnv } from "@/lib/env/server";
import * as Sentry from "@sentry/nextjs";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const SEND_TIMEOUT_MS = 10_000;

export function isEmailEnabled() {
  const env = getServerEnv();

  return Boolean(env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const env = getServerEnv();

  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) {
    return false;
  }

  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME },
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      Sentry.captureMessage("Brevo rejected a transactional email", {
        level: "error",
        extra: { status: response.status },
      });

      return false;
    }

    return true;
  } catch (error) {
    Sentry.captureException(error);

    return false;
  }
}
