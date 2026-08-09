import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityItem } from "@/components/data-display/activity-item";
import { Timeline } from "@/components/data-display/timeline";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { deleteApplicationAction } from "@/features/applications/actions/application-actions";
import { ApplicationDetailForm } from "@/features/applications/components/application-detail-form";
import { ApplicationStageBadge } from "@/features/applications/components/application-stage-badge";
import {
  getApplicationTimeline,
  getOwnedApplication,
} from "@/features/applications/server/application.service";
import { listOwnedVersionOptions } from "@/features/resumes/server/resume-version.service";

export const metadata: Metadata = {
  title: "Application",
};

type ApplicationPageProps = {
  params: Promise<{ applicationId: string }>;
};

export default async function ApplicationPage({
  params,
}: ApplicationPageProps) {
  const { applicationId } = await params;
  const user = await requireDatabaseUser();
  const row = await getOwnedApplication({
    userId: user.id,
    publicId: applicationId,
  });

  if (!row) {
    notFound();
  }

  const [activities, versions] = await Promise.all([
    getApplicationTimeline({ userId: user.id, publicId: applicationId }),
    listOwnedVersionOptions(user.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={row.jobTitle}
        description={row.jobCompany}
        action={<ApplicationStageBadge stage={row.application.stage} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Application</CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationDetailForm
                publicId={row.application.publicId}
                stage={row.application.stage}
                appliedAt={row.application.appliedAt}
                followUpAt={row.application.followUpAt}
                interviewAt={row.application.interviewAt}
                notes={row.application.notes}
                resumeVersionPublicId={row.versionPublicId}
                versions={versions}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <Timeline>
                  {activities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      title={activity.title}
                      description={activity.description ?? undefined}
                      time={activity.createdAt.toLocaleString()}
                    />
                  ))}
                </Timeline>
              ) : (
                <p className="text-meta text-text-secondary">
                  Nothing recorded yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href={`/dashboard/jobs/${row.jobPublicId}`}>
                  View job
                </Link>
              </Button>
              <form action={deleteApplicationAction}>
                <input
                  type="hidden"
                  name="publicId"
                  value={row.application.publicId}
                />
                <Button type="submit" variant="danger">
                  Stop tracking
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
