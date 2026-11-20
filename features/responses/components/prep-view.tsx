import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyContentButton } from "@/features/documents/components/ai-document-modal";
import type { InterviewPrep } from "@/lib/ai/schemas/interview-prep.schema";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-meta text-text-primary">{children}</CardContent>
    </Card>
  );
}

export function PrepView({ prep }: { prep: InterviewPrep }) {
  return (
    <div className="space-y-4">
      <p className="text-body text-text-primary">{prep.summary}</p>

      <Section title="What they will probe">
        <ul className="space-y-2">
          {prep.focusAreas.map((area) => (
            <li key={area.topic}>
              <span className="font-medium">{area.topic}.</span> <span className="text-text-secondary">{area.why}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Likely questions">
        <ol className="list-decimal space-y-3 pl-5">
          {prep.questions.map((item) => (
            <li key={item.question} className="space-y-1">
              <p className="font-medium">{item.question}</p>
              <p className="text-text-secondary">{item.answerOutline}</p>
              {item.evidence ? <p className="text-label text-text-muted">Use: {item.evidence}</p> : null}
            </li>
          ))}
        </ol>
      </Section>

      {prep.gapsToPrepare.length > 0 ? (
        <Section title="Gaps to prepare honestly">
          <ul className="space-y-2">
            {prep.gapsToPrepare.map((gap) => (
              <li key={gap.gap}>
                <span className="font-medium">{gap.gap}.</span> <span className="text-text-secondary">{gap.howToAddress}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Revision plan">
        <ol className="space-y-2">
          {prep.revisionPlan.map((day) => (
            <li key={day.day}>
              <span className="font-medium">Day {day.day}:</span> {day.tasks.join(" · ")}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Questions to ask them">
        <ul className="list-disc space-y-1 pl-5">
          {prep.questionsToAsk.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </Section>

      {prep.replyDraft ? (
        <Section title="Reply draft">
          <p className="whitespace-pre-line text-text-secondary">{prep.replyDraft}</p>
          <p className="text-label text-text-muted">HireLens never sends emails. Edit this and send it yourself.</p>
          <CopyContentButton content={prep.replyDraft} label="Reply draft" />
        </Section>
      ) : null}
    </div>
  );
}
