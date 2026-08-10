import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBlock } from "@/components/ui/score-block";
import {
  KEYWORD_GROUP_LABELS,
  type StoredJobFitAnalysis,
} from "@/lib/ai/schemas/job-fit-analysis.schema";
import type { AnalysisSuggestion } from "@/lib/db/schema";

const keywordTone = {
  PRESENT: "green",
  WEAK: "yellow",
  MISSING: "red",
} as const;

const keywordLabel = {
  PRESENT: "Present",
  WEAK: "Weak",
  MISSING: "Missing",
} as const;

const severityTone = {
  HIGH: "red",
  MEDIUM: "yellow",
  LOW: "neutral",
} as const;

const severityLabel = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

function Scores({ result }: { result: StoredJobFitAnalysis }) {
  const entries = [
    {
      label: "Overall",
      score: result.overallScore,
      explanation: result.scoreExplanations.overall?.explanation,
    },
    {
      label: "ATS",
      score: result.atsScore,
      explanation: result.scoreExplanations.ats?.explanation,
    },
    {
      label: "Job fit",
      score: result.jobFitScore,
      explanation: result.scoreExplanations.jobFit?.explanation,
    },
  ].filter((entry) => entry.score !== null);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {entries.map((entry) => (
        <ScoreBlock
          key={entry.label}
          label={entry.label}
          score={entry.score as number}
          caption={entry.explanation}
        />
      ))}
    </div>
  );
}

function KeywordGroups({ groups }: { groups: StoredJobFitAnalysis["keywordGroups"] }) {
  const populated = (
    Object.keys(KEYWORD_GROUP_LABELS) as (keyof typeof KEYWORD_GROUP_LABELS)[]
  )
    .map((key) => ({ key, items: groups[key] ?? [] }))
    .filter((group) => group.items.length > 0);

  if (populated.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keyword gaps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {populated.map((group) => (
          <section key={group.key} className="space-y-2">
            <h4 className="font-mono text-system font-medium uppercase text-text-muted">
              {KEYWORD_GROUP_LABELS[group.key]}
            </h4>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li
                  key={`${group.key}-${item.keyword}`}
                  className="flex flex-wrap items-start gap-x-2 gap-y-1"
                >
                  <Badge tone={keywordTone[item.status]}>
                    {keywordLabel[item.status]}
                  </Badge>
                  <span className="text-meta font-medium text-text-primary">
                    {item.keyword}
                  </span>
                  <p className="w-full text-label text-text-secondary">
                    {item.recommendation}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}

function BulletIssues({ issues }: { issues: StoredJobFitAnalysis["bulletIssues"] }) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bullet issues</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {issues.map((issue, index) => (
            <li key={`${index}-${issue.original}`} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
              <p className="text-meta text-text-primary">
                &ldquo;{issue.original}&rdquo;
              </p>
              <p className="text-label text-danger">{issue.issue}</p>
              <p className="text-label text-text-secondary">
                {issue.recommendation}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Recommendations({ suggestions }: { suggestions: AnalysisSuggestion[] }) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={severityTone[suggestion.severity]}>
                  {severityLabel[suggestion.severity]}
                </Badge>
                <span className="font-mono text-system uppercase text-text-muted">
                  {suggestion.category.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-meta font-medium text-text-primary">
                {suggestion.problem}
              </p>
              <p className="text-label text-text-secondary">{suggestion.reason}</p>
              <p className="text-label text-text-primary">{suggestion.action}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function AnalysisReport({
  result,
  suggestions,
}: {
  result: StoredJobFitAnalysis | null;
  suggestions: AnalysisSuggestion[];
}) {
  if (!result) {
    return <Recommendations suggestions={suggestions} />;
  }

  return (
    <div className="space-y-6">
      <Scores result={result} />

      {result.summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-meta leading-relaxed text-text-secondary">
              {result.summary}
            </p>
            {result.summaryRecommendation ? (
              <div className="rounded-md border border-border bg-surface-secondary p-3">
                <p className="font-mono text-system font-medium uppercase text-text-muted">
                  Suggested professional summary
                </p>
                <p className="mt-1.5 text-meta leading-relaxed text-text-primary">
                  {result.summaryRecommendation}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {result.missingRequirements.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Missing requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {result.missingRequirements.map((requirement) => (
                <li
                  key={requirement}
                  className="flex gap-2 text-meta text-text-secondary"
                >
                  <span aria-hidden className="text-danger">
                    &bull;
                  </span>
                  {requirement}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <KeywordGroups groups={result.keywordGroups} />
      <BulletIssues issues={result.bulletIssues} />
      <Recommendations suggestions={suggestions} />
    </div>
  );
}
