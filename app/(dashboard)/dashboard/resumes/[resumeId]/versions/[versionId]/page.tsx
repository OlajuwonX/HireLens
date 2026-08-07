import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { getOwnedResume } from "@/features/resumes/server/resume.service";
import { getOwnedResumeVersion } from "@/features/resumes/server/resume-version.service";
import { AnalysisList } from "@/features/analyses/components/analysis-list";
import { RunAnalysisForm } from "@/features/analyses/components/run-analysis-form";
import { listOwnedVersionAnalyses } from "@/features/analyses/server/analysis.service";
import { ResumeVersionActionsPanel } from "@/features/resumes/components/resume-version-actions-panel";
import { ResumeVersionSummary } from "@/features/resumes/components/resume-version-summary";

type VersionDetailPageProps = {
  params: Promise<{ resumeId: string; versionId: string }>;
};

export const metadata: Metadata = {
  title: "Resume version",
};

export default async function ResumeVersionDetailPage({
  params,
}: VersionDetailPageProps) {
  const { resumeId, versionId } = await params;
  const user = await requireDatabaseUser();
  const resume = await getOwnedResume({ userId: user.id, publicId: resumeId });
  const version = await getOwnedResumeVersion({
    userId: user.id,
    versionPublicId: versionId,
  });
  const analysisResult = await listOwnedVersionAnalyses({
    userId: user.id,
    versionPublicId: versionId,
  });

  if (!resume || !version || !analysisResult || version.resumeId !== resume.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={version.label}
        description={`Resume version ${version.versionNumber} for ${resume.title}.`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <RunAnalysisForm
              resumePublicId={resume.publicId}
              versionPublicId={version.publicId}
            />
            <ResumeVersionActionsPanel version={version} />
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ResumeVersionSummary version={version} />
        <EmptyState
          title="Score history coming next"
          description="Stage 8 analysis records will populate score history and comparison data."
        />
      </div>
      <AnalysisList analyses={analysisResult.analyses} />
    </div>
  );
}
