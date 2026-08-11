import { ScoreBlock } from "@/components/ui/score-block";
import { Card, CardContent } from "@/components/ui/card";
import type { StoredApplicationIntelligence } from "@/lib/ai/schemas/application-intelligence.schema";

const labels: [keyof StoredApplicationIntelligence["scoring"], string][] = [
  ["overallScore", "Overall"],
  ["atsScore", "ATS"],
  ["requirementsScore", "Requirements"],
  ["skillsScore", "Skills"],
  ["experienceScore", "Experience"],
  ["keywordScore", "Keywords"],
];

export function ScorePanel({
  scoring,
}: {
  scoring: StoredApplicationIntelligence["scoring"];
}) {
  const entries = labels
    .map(([key, label]) => ({ label, value: scoring[key] }))
    .filter((entry): entry is { label: string; value: number } =>
      typeof entry.value === "number",
    );

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <ScoreBlock key={entry.label} label={entry.label} score={entry.value} />
        ))}
      </div>

      {scoring.explanation ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-meta leading-relaxed text-text-secondary">
              {scoring.explanation}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
