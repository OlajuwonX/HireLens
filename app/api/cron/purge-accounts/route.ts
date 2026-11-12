import {
  purgeExpiredAccounts,
  sendPurgeWarnings,
} from "@/features/account/server/purge.service";
import { isAuthorizedCron } from "@/lib/cron/authorize";
import { getServerEnv } from "@/lib/env/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return new Response("Not found", { status: 404 });
  }

  const dryRun = getServerEnv().PURGE_DRY_RUN;

  try {
    const warnings = await sendPurgeWarnings({ dryRun });
    const report = await purgeExpiredAccounts({ dryRun });

    Sentry.captureMessage("Account purge run", {
      level: report.failed > 0 ? "warning" : "info",
      tags: { source: "account-purge" },
      extra: {
        dryRun: report.dryRun,
        eligible: report.eligible,
        purged: report.purged,
        failed: report.failed,
        warned: warnings.warned,
      },
    });

    return Response.json({
      dryRun: report.dryRun,
      eligible: report.eligible,
      purged: report.purged,
      failed: report.failed,
      warned: warnings.warned,
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { source: "account-purge" } });

    return new Response("Purge failed", { status: 500 });
  }
}
