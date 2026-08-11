import { BackButton } from "@/components/layout/back-button";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { ResumeActionsPanel } from "@/features/resumes/components/resume-actions-panel";
import { ResumeStatusBadge } from "@/features/resumes/components/resume-status-badge";
import { ResumeVersionList } from "@/features/resumes/components/resume-version-list";
import { UploadVersionForm } from "@/features/resumes/components/upload-version-form";
import { getOwnedResume } from "@/features/resumes/server/resume.service";
import { listOwnedResumeVersions } from "@/features/resumes/server/resume-version.service";

type ResumeDetailPageProps = {
  params: Promise<{ resumeId: string }>;
};

export const metadata: Metadata = {
  title: "Resume group",
};

export default async function ResumeDetailPage({
  params,
}: ResumeDetailPageProps) {
  const { resumeId } = await params;
  const user = await requireDatabaseUser();
  const resume = await getOwnedResume({ userId: user.id, publicId: resumeId });
  const versionResult = await listOwnedResumeVersions({
    userId: user.id,
    resumePublicId: resumeId,
  });

  if (!resume || !versionResult) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/resumes" label="Resumes" />

      <PageHeader
        title={resume.title}
        description="Every version in this resume group. The default is used when you create an application."
        action={<ResumeStatusBadge status={resume.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Versions ({versionResult.versions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t border-border">
                <ResumeVersionList versions={versionResult.versions} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add a version</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadVersionForm resumePublicId={resume.publicId} />
            </CardContent>
          </Card>

          <ResumeActionsPanel resume={resume} />
        </div>
      </div>
    </div>
  );
}
