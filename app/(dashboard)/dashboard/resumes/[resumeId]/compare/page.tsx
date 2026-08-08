import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { listOwnedResumeVersions } from "@/features/resumes/server/resume-version.service";

type ComparePageProps = {
  params: Promise<{ resumeId: string }>;
};

export const metadata: Metadata = {
  title: "Compare resume versions",
};

export default async function CompareResumeVersionsPage({ params }: ComparePageProps) {
  const { resumeId } = await params;
  const user = await requireDatabaseUser();
  const result = await listOwnedResumeVersions({
    userId: user.id,
    resumePublicId: resumeId,
  });

  if (!result) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compare versions"
        description={`Compare versions for ${result.resume.title}.`}
      />
      <EmptyState
        title={
          result.versions.length > 1
            ? "Comparison foundation ready"
            : "Create another version to compare"
        }
        description="Run an analysis on two or more versions to compare their scores."
      />
    </div>
  );
}
