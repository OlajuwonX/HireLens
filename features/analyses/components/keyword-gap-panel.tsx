import { Badge } from "@/components/ui/badge";
import type { KeywordAnalysis } from "@/lib/ai/schemas/keywords.schema";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h4 className="font-mono text-system font-medium uppercase text-text-muted">
        {title}
      </h4>
      {children}
    </section>
  );
}

export function KeywordGapPanel({ analysis }: { analysis: KeywordAnalysis }) {
  const empty =
    analysis.present.length === 0 &&
    analysis.transferable.length === 0 &&
    analysis.missing.length === 0 &&
    analysis.avoidForcing.length === 0;

  if (empty) {
    return (
      <p className="text-meta text-text-secondary">
        No keyword analysis was returned for this application.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {analysis.present.length > 0 ? (
        <Section title="Present">
          <div className="flex flex-wrap gap-1.5">
            {analysis.present.map((keyword) => (
              <Badge key={keyword} tone="green">
                {keyword}
              </Badge>
            ))}
          </div>
        </Section>
      ) : null}

      {analysis.transferable.length > 0 ? (
        <Section title="Transferable">
          <ul className="space-y-2">
            {analysis.transferable.map((item) => (
              <li key={item.required} className="space-y-0.5">
                <p className="text-meta font-medium text-text-primary">
                  {item.required}
                </p>
                <p className="text-label text-text-secondary">
                  {item.existingEvidence}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {analysis.missing.length > 0 ? (
        <Section title="Missing">
          <ul className="space-y-2">
            {analysis.missing.map((item) => (
              <li key={item.keyword} className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-meta font-medium text-text-primary">
                    {item.keyword}
                  </span>
                  <Badge
                    tone={
                      item.gapType === "QUALIFICATION_GAP" ? "red" : "yellow"
                    }
                  >
                    {item.gapType === "QUALIFICATION_GAP"
                      ? "Qualification gap"
                      : "Wording only"}
                  </Badge>
                </div>
                <p className="text-label text-text-secondary">
                  {item.explanation}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {analysis.avoidForcing.length > 0 ? (
        <Section title="Do not force">
          <div className="flex flex-wrap gap-1.5">
            {analysis.avoidForcing.map((keyword) => (
              <Badge key={keyword}>{keyword}</Badge>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}
