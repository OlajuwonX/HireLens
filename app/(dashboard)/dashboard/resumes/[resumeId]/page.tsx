import { BackButton } from "@/components/layout/back-button";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { ManageResumeDialog } from "@/features/resumes/components/manage-resume-dialog";
import { ResumeStatusBadge } from "@/features/resumes/components/resume-status-badge";
import { ResumeVersionList } from "@/features/resumes/components/resume-version-list";
import { UpdateResumeDialog } from "@/features/resumes/components/update-resume-dialog";
import { getOwnedResume } from "@/features/resumes/server/resume.service";
import { listOwnedResumeVersions } from "@/features/resumes/server/resume-version.service";

type ResumeDetailPageProps = {
  params: Promise<{ resumeId: string }>;
};

export const metadata: Metadata = {
  title: "Job title",
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
        description="Every resume filed under this job title, including the ones improved by AI. The default is used when you create an application."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ResumeStatusBadge status={resume.status} />
            <UpdateResumeDialog
              resumePublicId={resume.publicId}
              resumeTitle={resume.title}
            />
            <ManageResumeDialog resume={resume} />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Resumes ({versionResult.versions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-border">
            <ResumeVersionList
              versions={versionResult.versions}
              resumePublicId={resume.publicId}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
