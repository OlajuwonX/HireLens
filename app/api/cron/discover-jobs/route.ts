import * as Sentry from "@sentry/nextjs";
import { runDailyDiscovery } from "@/features/discovery/server/discovery.service";
import { isAuthorizedCron } from "@/lib/cron/authorize";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const report = await runDailyDiscovery();

    Sentry.captureMessage("Job discovery run", {
      level: report.failed > 0 ? "warning" : "info",
      tags: { source: "job-discovery" },
      extra: report,
    });

    return Response.json(report);
  } catch (error) {
    Sentry.captureException(error, { tags: { source: "job-discovery" } });

    return new Response("Discovery failed", { status: 500 });
  }
}
