import { Frame, Line, Tag } from "./frame";
import { storyJob } from "./early";

function Placeholder() {
  return <span className="font-mono text-warning">[X]</span>;
}

export function GapsVisual() {
  return (
    <Frame label="Gap · Design systems">
      <div data-reveal className="grid gap-1">
        <Tag>Before</Tag>
        <p className="text-meta text-text-muted line-through decoration-text-muted/50">
          Worked on UI components for the web app.
        </p>
      </div>
      <div data-reveal className="grid gap-1 rounded-control border border-accent/40 bg-surface-secondary p-4">
        <Tag tone="accent">Suggested</Tag>
        <p className="text-meta text-text-primary">
          Built and documented a shared component library used by <Placeholder /> product teams, cutting UI bugs by{" "}
          <Placeholder />%.
        </p>
      </div>
      <p data-reveal className="text-label text-text-secondary">
        Placeholders stay until you add the real numbers.
      </p>
    </Frame>
  );
}

const stages = ["Tracking", "Preparing", "Ready", "Sent"];

export function ApplyVisual() {
  return (
    <Frame label={`${storyJob.company} · application`}>
      <ol data-reveal className="flex flex-wrap gap-2">
        {stages.map((stage) => (
          <li
            key={stage}
            className={
              stage === "Ready"
                ? "rounded-control bg-accent px-3 py-1 font-mono text-system font-medium uppercase text-accent-text"
                : "rounded-control border border-border px-3 py-1 font-mono text-system uppercase text-text-muted"
            }
          >
            {stage}
          </li>
        ))}
      </ol>
      <Line title="Tailored resume" detail="Version 3, matched to this posting" tag={<Tag tone="accent">Ready</Tag>} />
      <Line title="Cover letter" detail="Written from your analysis" tag={<Tag tone="accent">Ready</Tag>} />
      <Line title="Follow-up email" detail="For five days after you apply" tag={<Tag>Drafted</Tag>} />
    </Frame>
  );
}

const today = [
  ["01", `Interview with ${storyJob.company}`, "Thursday at 10:00 · found in your inbox"],
  ["12", "Likely interview questions", `Prepared for ${storyJob.title}`],
  ["01", "Follow up with Globex", "Sent 6 days ago"],
] as const;

export function ReplyVisual() {
  return (
    <Frame label="Today">
      {today.map(([count, title, detail], index) => (
        <div key={title} data-reveal className="flex items-start gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
          <span
            data-numeric
            className={index === 0 ? "font-mono text-section-title text-accent" : "font-mono text-section-title text-text-muted"}
          >
            {count}
          </span>
          <div className="min-w-0">
            <p className="text-meta font-medium text-text-primary">{title}</p>
            <p className="text-label text-text-secondary">{detail}</p>
          </div>
        </div>
      ))}
    </Frame>
  );
}
