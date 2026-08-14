import { Badge } from "@/components/ui/badge";
import type { Recommendation } from "@/lib/ai/schemas/recommendations.schema";

const tone = {
  HIGH: "red",
  MEDIUM: "yellow",
  LOW: "neutral",
} as const;

const label = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

export function RecommendationList({ items }: { items: Recommendation[] }) {
  if (items.length === 0) {
    return (
      <p className="text-meta text-text-secondary">
        No recommendations were returned for this application.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item, index) => (
        <li
          key={`${index}-${item.problem}`}
          className="space-y-1.5 py-3 first:pt-0 last:pb-0"
        >
          <Badge tone={tone[item.priority]}>{label[item.priority]}</Badge>
          <p className="text-meta font-medium text-text-primary">
            {item.problem}
          </p>
          {item.evidence ? (
            <blockquote className="border-l-2 border-accent pl-3 text-label italic text-text-secondary">
              {item.evidence}
            </blockquote>
          ) : null}
          <p className="text-label text-text-primary">
            {item.recommendedAction}
          </p>
          <p className="text-label text-text-secondary">{item.reason}</p>
        </li>
      ))}
    </ul>
  );
}
