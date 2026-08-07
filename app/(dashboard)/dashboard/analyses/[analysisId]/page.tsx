import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/data-display/status-badge";
import { AnalysisResultCard } from "@/features/analyses/components/analysis-result-card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { getOwnedAnalysis } from "@/features/analyses/server/analysis.service";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={analysis.type === "GENERAL" ? "General analysis" : "Job-fit analysis"}
        description={`Prompt ${analysis.promptVersion} · Model ${analysis.model}`}
        action={<StatusBadge status={analysis.status.toLowerCase()} />}
      />
      <AnalysisResultCard analysis={analysis} />
    </div>
  );
}
