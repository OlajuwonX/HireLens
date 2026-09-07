import {
  purgeExpiredAccounts,
  sendPurgeWarnings,
} from "@/features/account/server/purge.service";
import { getServerEnv } from "@/lib/env/server";
import * as Sentry from "@sentry/nextjs";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorised(request: Request) {
  const expected = getServerEnv().CRON_SECRET;

  if (!expected) {
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  const offered = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(offered);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
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
