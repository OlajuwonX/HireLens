import { StatusBadge } from "@/components/data-display/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { AnalysisResultCard } from "@/features/analyses/components/analysis-result-card";
import { RequirementMatrix } from "@/features/analyses/components/requirement-matrix";
import { getOwnedAnalysis } from "@/features/analyses/server/analysis.service";
import { listRequirementMatchesForAnalysis } from "@/features/analyses/server/requirement-match.repository";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type AnalysisDetailPageProps = {
  params: Promise<{ analysisId: string }>;
};

export const metadata: Metadata = {
  title: "Analysis",
};

export default async function AnalysisDetailPage({
  params,
}: AnalysisDetailPageProps) {
  const { analysisId } = await params;
  const user = await requireDatabaseUser();
  const analysis = await getOwnedAnalysis({
    userId: user.id,
    analysisPublicId: analysisId,
  });

  if (!analysis) {
    notFound();
  }

  const rows =
    analysis.type === "JOB_SPECIFIC"
      ? await listRequirementMatchesForAnalysis({
          userId: user.id,
          analysisId: analysis.id,
        })
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          analysis.type === "GENERAL" ? "General analysis" : "Job-fit analysis"
        }
        description={`Prompt ${analysis.promptVersion} · Model ${analysis.model}`}
        action={<StatusBadge status={analysis.status.toLowerCase()} />}
      />
      <AnalysisResultCard analysis={analysis} />
      <RequirementMatrix rows={rows} analysisPublicId={analysis.publicId} />
    </div>
  );
}
