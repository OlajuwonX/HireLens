import "server-only";

import type { CreateBugReportInput } from "../schemas/bug-report.schema";
import { countReportsInWindow, createBugReport } from "./bug-report.repository";

const REPORT_WINDOW_MINUTES = 60;
const REPORTS_PER_WINDOW = 5;

function safeRoute(route: string | undefined) {
  if (!route) {
    return "unknown";
  }

  const trimmed = route.trim();

  if (!trimmed.startsWith("/")) {
    return "unknown";
  }

  return trimmed.split("?")[0].slice(0, 512);
}

export async function submitBugReport(input: {
  userId: string;
  values: CreateBugReportInput;
}) {
  const since = new Date(Date.now() - REPORT_WINDOW_MINUTES * 60 * 1000);
  const recent = await countReportsInWindow({ userId: input.userId, since });

  if (recent >= REPORTS_PER_WINDOW) {
    return {
      ok: false as const,
      message: "You have sent several reports recently. Try again a bit later.",
    };
  }

  const report = await createBugReport({
    userId: input.userId,
    category: input.values.category,
    title: input.values.title,
    description: input.values.description,
    route: safeRoute(input.values.route),
    sentryEventId: input.values.sentryEventId ?? null,
  });

  return { ok: true as const, publicId: report.publicId };
}
