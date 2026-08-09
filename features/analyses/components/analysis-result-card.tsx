import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScoreCard } from "@/components/data-display/score-card";
import type { ResumeAnalysis } from "@/lib/db/schema";

export function AnalysisResultCard({ analysis }: { analysis: ResumeAnalysis }) {
  const normalized = analysis.normalizedResult as {
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: { problem: string; action: string }[];
  } | null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ScoreCard label="Overall score" score={analysis.overallScore ?? 0} />
        <ScoreCard label="ATS score" score={analysis.atsScore ?? 0} />
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-section-title font-semibold text-text-primary">Summary</h2>
        </CardHeader>
        <CardContent className="space-y-4 text-meta text-text-secondary">
          <p>{normalized?.summary ?? analysis.failureReason ?? "Analysis pending."}</p>
          {normalized?.recommendations?.length ? (
            <div className="space-y-2">
              <h3 className="font-semibold text-text-primary">Recommendations</h3>
              <ul className="list-disc space-y-2 pl-5">
                {normalized.recommendations.map((recommendation) => (
                  <li key={recommendation.problem}>
                    <span className="font-medium">{recommendation.problem}</span>:{" "}
                    {recommendation.action}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
