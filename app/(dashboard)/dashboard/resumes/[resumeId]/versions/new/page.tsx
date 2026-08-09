import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { getOwnedResume } from "@/features/resumes/server/resume.service";
import { CreateResumeVersionForm } from "@/features/resumes/components/create-resume-version-form";

type NewVersionPageProps = {
  params: Promise<{ resumeId: string }>;
};

export const metadata: Metadata = {
  title: "New resume version",
};

export default async function NewResumeVersionPage({ params }: NewVersionPageProps) {
  const { resumeId } = await params;
  const user = await requireDatabaseUser();
  const resume = await getOwnedResume({ userId: user.id, publicId: resumeId });

  if (!resume) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`New version for ${resume.title}`}
        description="Attach an existing resume PDF file asset as a version."
      />
      <Card>
        <CardHeader>
          <h2 className="text-section-title font-semibold text-text-primary">Version metadata</h2>
        </CardHeader>
        <CardContent>
          <CreateResumeVersionForm resumePublicId={resume.publicId} />
        </CardContent>
      </Card>
    </div>
  );
}
