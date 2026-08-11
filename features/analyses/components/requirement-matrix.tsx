import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequirementCorrectionForm } from "./requirement-correction-form";
import type { RequirementMatch } from "@/lib/ai/schemas/requirements.schema";
import type { UserEvidenceCorrection } from "@/lib/db/schema";

export type RequirementMatrixRow = {
  match: RequirementMatch;
  correction: UserEvidenceCorrection | null;
};

const statusTone = {
  STRONG: "green",
  PARTIAL: "yellow",
  MISSING: "red",
  UNCLEAR: "neutral",
} as const;

const statusLabel = {
  STRONG: "Strong",
  PARTIAL: "Partial",
  MISSING: "Missing",
  UNCLEAR: "Unclear",
} as const;

const categoryLabel = {
  SKILL: "Skill",
  EXPERIENCE: "Experience",
  EDUCATION: "Education",
  CERTIFICATION: "Certification",
  RESPONSIBILITY: "Responsibility",
  LOCATION: "Location",
  OTHER: "Other",
} as const;

function summarise(rows: RequirementMatrixRow[]) {
  const required = rows.filter((row) => row.match.importance === "REQUIRED");
  const met = required.filter((row) => row.match.status === "STRONG");

  return { required: required.length, met: met.length };
}

export function RequirementMatrix({
  rows,
  analysisId,
}: {
  rows: RequirementMatrixRow[];
  analysisId: string;
}) {
  if (rows.length === 0) {
    return null;
  }

  const { required, met } = summarise(rows);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Requirement matrix</CardTitle>
        <p className="font-mono text-system text-text-muted">
          {met} of {required} required met
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <ul className="divide-y divide-border border-t border-border">
          {rows.map(({ match, correction }) => (
            <li key={match.key} className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <p className="min-w-0 flex-1 text-meta font-medium text-text-primary">
                  {match.requirement}
                </p>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge tone={statusTone[match.status]}>
                    {statusLabel[match.status]}
                  </Badge>
                  <Badge
                    tone={match.importance === "REQUIRED" ? "blue" : "neutral"}
                  >
                    {match.importance === "REQUIRED" ? "Required" : "Preferred"}
                  </Badge>
                </div>
              </div>

              <p className="font-mono text-system uppercase text-text-muted">
                {categoryLabel[match.category]}
              </p>

              <p className="text-meta text-text-secondary">
                {match.explanation}
              </p>

              {match.resumeEvidence ? (
                <blockquote className="border-l-2 border-accent pl-3 text-meta italic text-text-secondary">
                  {match.resumeEvidence}
                </blockquote>
              ) : null}

              {match.recommendation ? (
                <p className="text-meta text-text-secondary">
                  <span className="font-medium text-text-primary">
                    Suggested:{" "}
                  </span>
                  {match.recommendation}
                </p>
              ) : null}

              {correction?.markedIncorrect ? (
                <p className="text-label font-medium text-warning">
                  You marked this conclusion as incorrect.
                </p>
              ) : null}

              <RequirementCorrectionForm
                analysisId={analysisId}
                requirementKey={match.key}
                markedIncorrect={correction?.markedIncorrect ?? false}
                evidence={correction?.evidence ?? null}
                notes={correction?.notes ?? null}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
