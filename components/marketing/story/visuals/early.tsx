import { MatchPanel } from "@/components/data-display/match-panel";
import { Frame, Line, Tag } from "./frame";

export const storyJob = { title: "Senior Frontend Engineer", company: "Northwind" };

export const storyParts = [
  { label: "Requirements", score: 88 },
  { label: "Skills", score: 91 },
  { label: "Experience", score: 78 },
  { label: "Keywords", score: 57 },
  { label: "ATS readability", score: 87 },
];

export function PostingVisual() {
  return (
    <Frame label="Discover · new today">
      <div data-reveal className="rounded-control border border-accent/40 bg-surface-secondary p-4">
        <p className="text-section-title font-semibold text-text-primary">{storyJob.title}</p>
        <p className="text-meta text-text-secondary">{storyJob.company} · Remote</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <Tag tone="accent">Fits your roles</Tag>
          <Tag>Full time</Tag>
          <Tag>2 h ago</Tag>
        </div>
      </div>
      <Line title="Product Designer" detail="Globex · Hybrid" tag={<Tag>5 h ago</Tag>} />
      <Line title="Platform Engineer" detail="Initech · Remote" tag={<Tag>yesterday</Tag>} />
    </Frame>
  );
}

const requirements = [
  ["5+ years building React apps", "Required"],
  ["TypeScript in production", "Required"],
  ["Design systems", "Required"],
  ["Accessibility (WCAG 2.2)", "Preferred"],
  ["GraphQL", "Preferred"],
] as const;

export function ReadingVisual() {
  return (
    <Frame label={`${storyJob.company} · 5 requirements found`}>
      {requirements.map(([title, kind]) => (
        <Line key={title} title={title} tag={<Tag tone={kind === "Required" ? "accent" : "muted"}>{kind}</Tag>} />
      ))}
    </Frame>
  );
}

export function MatchVisual() {
  return <MatchPanel context={`${storyJob.title} · ${storyJob.company}`} total={82} parts={storyParts} />;
}
