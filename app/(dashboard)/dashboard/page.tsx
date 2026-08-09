import Link from "next/link";
import { MetricCard } from "@/components/data-display/metric-card";
import { PageTitle } from "@/components/layout/page-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { getDashboardSummary } from "@/features/dashboard/server/dashboard.service";
import { documentTypeLabels } from "@/features/documents/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overview",
};

function greeting(name: string | null) {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = name?.trim().split(/\s+/)[0];

  return first ? `${part}, ${first}.` : `${part}.`;
}

export default async function DashboardPage() {
  const user = await requireDatabaseUser();
  const summary = await getDashboardSummary(user.id);

  return (
    <div className="space-y-6">
      <PageTitle title="Overview" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
        <p className="text-page-title font-semibold text-text-primary">
          {greeting(user.name)}
        </p>
        <p className="mt-1 text-meta text-text-secondary">
          Here&rsquo;s where your job search stands.
        </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/resumes/new">Add Resume</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/applications">Create Application</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Resumes" value={summary.resumeGroupCount} hint={`${summary.resumeVersionCount} versions`} />
        <MetricCard label="Applications" value={summary.applicationCount} hint={`${summary.pendingCount} pending`} />
        <MetricCard label="Accepted" value={summary.acceptedCount} hint={`${summary.rejectedCount} rejected`} />
        <MetricCard label="Avg Match" value={summary.averageMatchScore ?? "—"} hint={summary.averageMatchScore === null ? "Run an analysis" : "Latest analyses"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentApplications.length === 0 ? (
              <p className="text-meta text-text-secondary">No applications yet.</p>
            ) : (
              summary.recentApplications.map((application) => (
                <Link
                  key={application.publicId}
                  href={`/dashboard/jobs?open=${application.publicId}`}
                  className="block text-meta text-text-primary underline-offset-4 hover:underline"
                >
                  {application.title} at {application.company}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent AI Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentDocuments.length === 0 ? (
              <p className="text-meta text-text-secondary">No AI documents yet.</p>
            ) : (
              summary.recentDocuments.map((document) => (
                <Link
                  key={document.publicId}
                  href={`/dashboard/documents/${document.publicId}`}
                  className="block text-meta text-text-primary underline-offset-4 hover:underline"
                >
                  {documentTypeLabels[document.type]}
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Usage Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.usage.slice(0, 4).map((item) => (
              <div key={item.action} className="flex justify-between gap-3 text-meta">
                <span className="text-text-secondary">{item.label}</span>
                <span className="font-mono text-text-primary">
                  {item.used} / {item.limit}
                </span>
              </div>
            ))}
            <p className="pt-2 text-label text-text-muted">Resets tomorrow.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
