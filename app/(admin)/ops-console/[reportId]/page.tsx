import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPS_CONSOLE_PATH } from "@/features/admin/constants";
import { requireAdminUser } from "@/features/admin/server/require-admin";
import { BugStatusControl } from "@/features/bug-reports/components/bug-status-control";
import { bugCategoryLabels } from "@/features/bug-reports/constants";
import { findBugReportByPublicId } from "@/features/bug-reports/server/bug-report.repository";

export const metadata: Metadata = {
  title: "Bug report",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-meta text-text-secondary">{label}</dt>
      <dd className="break-all text-right text-meta text-text-primary">
        {value}
      </dd>
    </div>
  );
}

export default async function BugReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  await requireAdminUser();

  const { reportId } = await params;
  const row = await findBugReportByPublicId(reportId);

  if (!row) {
    notFound();
  }

  const { report, reporterEmail } = row;
  const sentryOrg = process.env.SENTRY_ORG;
  const sentryProject = process.env.SENTRY_PROJECT;
  const sentryHref =
    report.sentryEventId && sentryOrg && sentryProject
      ? `https://${sentryOrg}.sentry.io/issues/?query=${encodeURIComponent(report.sentryEventId)}&project=${sentryProject}`
      : null;

  return (
    <div className="space-y-6">
      <BackButton href={OPS_CONSOLE_PATH} label="Bug reports" />

      <PageHeader title={report.title} description={reporterEmail} />

      <div className="flex flex-wrap items-center gap-3">
        <Badge>{bugCategoryLabels[report.category]}</Badge>
        <BugStatusControl
          publicId={report.publicId}
          status={report.status}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>What happened</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
            <p className="whitespace-pre-wrap wrap-break-word text-meta leading-relaxed text-text-primary">
              {report.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
            <dl>
              <Row label="Route" value={report.route} />
              <Row label="Reported" value={report.createdAt.toLocaleString()} />
              <Row label="Updated" value={report.updatedAt.toLocaleString()} />
            </dl>

            <div className="border-t border-border pt-3">
              <p className="font-mono text-system uppercase text-text-muted">
                Sentry
              </p>
              {sentryHref ? (
                <Button asChild variant="outline" size="compact" className="mt-2">
                  <a href={sentryHref} target="_blank" rel="noopener noreferrer">
                    Open in Sentry
                  </a>
                </Button>
              ) : (
                <p className="mt-1 text-meta text-text-secondary">
                  {report.sentryEventId
                    ? "Sentry organisation is not configured."
                    : "No associated Sentry event"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
