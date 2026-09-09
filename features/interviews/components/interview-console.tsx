import { Card, CardContent } from "@/components/ui/card";
import type { InterviewPageData } from "../server/interview-page.service";
import { INTERVIEW_CYCLE_DAYS } from "../constants";
import { InterviewQuestionCard } from "./interview-question-card";

type ReadyData = Extract<InterviewPageData, { status: "ready" }>;

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
        <p className="font-mono text-system uppercase text-text-muted">
          {label}
        </p>
        <p className="mt-2 text-[1.5rem] font-semibold leading-none text-text-primary tabular-nums">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-meta text-text-secondary">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-section-title font-semibold text-text-primary">
        {title}
      </h2>
      <span className="font-mono text-system uppercase text-text-muted">
        {hint}
      </span>
    </div>
  );
}

function answeredCount(questions: ReadyData["practice"]) {
  return questions.filter((question) => question.answered).length;
}

export function InterviewConsole({ data }: { data: ReadyData }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Readiness" value={`${data.readiness}%`} />
        <Stat
          label="Answered"
          value={`${data.progress.attempted} / ${data.progress.total}`}
        />
        <Stat
          label="Correct"
          value={String(data.progress.correct)}
          hint={`${data.progress.incorrect} incorrect`}
        />
      </div>

      {data.completed ? (
        <Card>
          <CardContent className="space-y-1 px-5 pb-5 pt-5">
            <p className="text-section-title font-semibold text-text-primary">
              This week is complete.
            </p>
            <p className="text-meta text-text-secondary">
              You finished every question with a readiness score of{" "}
              {data.readiness}%. A fresh set opens next week.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <SectionHeading
          title="Daily questions"
          hint={`Day ${data.dayIndex} of ${INTERVIEW_CYCLE_DAYS}`}
        />
        {data.dailyToday.length === 0 ? (
          <p className="text-meta text-text-secondary">
            Today&rsquo;s daily questions are not available yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.dailyToday.map((question, index) => (
              <InterviewQuestionCard
                key={question.questionPublicId}
                question={question}
                index={index + 1}
              />
            ))}
          </ul>
        )}
        {data.dailyUpcoming > 0 ? (
          <p className="text-label text-text-muted">
            {data.dailyUpcoming} more daily{" "}
            {data.dailyUpcoming === 1 ? "question" : "questions"} unlock later
            this week.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Practice"
          hint={`${answeredCount(data.practice)} / ${data.practice.length} done`}
        />
        {data.practice.length === 0 ? (
          <p className="text-meta text-text-secondary">
            No practice questions in this set.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.practice.map((question, index) => (
              <InterviewQuestionCard
                key={question.questionPublicId}
                question={question}
                index={index + 1}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
