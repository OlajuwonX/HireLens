import * as Sentry from "@sentry/nextjs";
import { runGmailChecks } from "@/features/responses/server/gmail/gmail-run.service";
import { isAuthorizedCron } from "@/lib/cron/authorize";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const report = await runGmailChecks();

    if (report.failed > 0) {
      Sentry.captureMessage("Gmail check had failures", { level: "warning", tags: { source: "gmail-check" }, extra: report });
    }

    return Response.json(report);
  } catch (error) {
    Sentry.captureException(error, { tags: { source: "gmail-check" } });

    return new Response("Gmail check failed", { status: 500 });
  }
}
