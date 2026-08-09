import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/data-display/status-badge";
import type { ResumeAnalysis } from "@/lib/db/schema";

export function AnalysisList({ analyses }: { analyses: ResumeAnalysis[] }) {
  if (analyses.length === 0) {
    return (
      <EmptyState
        title="No analyses yet"
        description="Run a general resume analysis to create the first score record."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {analyses.map((analysis) => (
        <Card key={analysis.publicId}>
          <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
            <div>
              <Link
                href={`/dashboard/analyses/${analysis.publicId}`}
                className="font-semibold text-text-primary hover:text-text-primary"
              >
                {analysis.type === "GENERAL" ? "General analysis" : "Job-fit analysis"}
              </Link>
              <p className="mt-1 text-meta text-text-secondary">
                {analysis.overallScore !== null
                  ? `Overall ${analysis.overallScore}/100 · ATS ${analysis.atsScore ?? 0}/100`
                  : "Score pending"}
              </p>
            </div>
            <StatusBadge status={analysis.status.toLowerCase()} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
