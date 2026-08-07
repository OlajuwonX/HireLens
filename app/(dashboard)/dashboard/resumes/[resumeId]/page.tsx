import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ResumeActionsPanel } from "@/features/resumes/components/resume-actions-panel";
import { ResumeStatusBadge } from "@/features/resumes/components/resume-status-badge";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { getOwnedResume } from "@/features/resumes/server/resume.service";

type ResumeDetailPageProps = {
  params: Promise<{
    resumeId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Resume details",
};

export default async function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const { resumeId } = await params;
  const user = await requireDatabaseUser();
  const resume = await getOwnedResume({ userId: user.id, publicId: resumeId });

  if (!resume) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={resume.title}
        description="Review and manage this resume record."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-950">Status</h2>
              <ResumeStatusBadge status={resume.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>Public ID: {resume.publicId}</p>
            <p>Created: {resume.createdAt.toLocaleString()}</p>
            <p>Updated: {resume.updatedAt.toLocaleString()}</p>
            <p>
              Upload metadata exists. File attachment and resume versions are next
              in the staged rebuild.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-950">Actions</h2>
          </CardHeader>
          <CardContent>
            <ResumeActionsPanel resume={resume} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
