import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardInterview } from "../server/interview-dashboard.service";

const INTERVIEW_HREF = "/dashboard/interview";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle>Interview Readiness</CardTitle>
        <span className="rounded-control bg-accent px-2 py-0.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wide text-accent-text">
          New
        </span>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Prerequisites({
  interview,
}: {
  interview: Extract<DashboardInterview, { state: "prerequisites" }>;
}) {
  const next = !interview.hasResume
    ? { label: "Upload a resume", href: "/dashboard/resumes" }
    : { label: "Save a job", href: "/dashboard/jobs" };

  return (
    <div className="space-y-3">
      <p className="text-meta text-text-secondary">
        Prepare for interviews tailored to your career. Add a resume and a saved
        job to unlock your first weekly set.
      </p>
      <ul className="space-y-1 text-meta text-text-secondary">
        <li>{interview.hasResume ? "✓" : "○"} Upload a resume</li>
        <li>{interview.hasJobContext ? "✓" : "○"} Save a job</li>
      </ul>
      <Button asChild variant="outline" size="compact">
        <Link href={next.href}>{next.label}</Link>
      </Button>
    </div>
  );
}

function ReadyToStart() {
  return (
    <div className="space-y-3">
      <p className="text-meta text-text-secondary">
        Your weekly interview set is ready to begin. Two daily questions unlock
        each day, with extra practice questions available any time.
      </p>
      <Button asChild size="compact">
        <Link href={INTERVIEW_HREF}>Start interview week</Link>
      </Button>
    </div>
  );
}

function Active({
  interview,
}: {
  interview: Extract<DashboardInterview, { state: "active" }>;
}) {
  const dailyLabel =
    interview.dailyDueToday === 0
      ? "No daily questions today"
      : `${interview.dailyAnsweredToday} / ${interview.dailyDueToday} daily questions done today`;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[2rem] font-semibold leading-none text-text-primary tabular-nums">
          {interview.readiness}%
        </p>
        <p className="mt-1 text-meta text-text-secondary">
          {interview.completed
            ? "This week is complete."
            : `${interview.attempted} / ${interview.total} attempted`}
        </p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-meta">
        <span className="text-text-secondary">
          <span className="text-text-primary">✓ {interview.correct}</span>{" "}
          correct
        </span>
        <span className="text-text-secondary">
          <span className="text-text-primary">✕ {interview.incorrect}</span>{" "}
          incorrect
        </span>
        <span className="text-text-secondary">{dailyLabel}</span>
      </div>

      <Button asChild size="compact">
        <Link href={INTERVIEW_HREF}>
          {interview.completed
            ? "Review this week"
            : `${interview.remaining} questions left`}
        </Link>
      </Button>
    </div>
  );
}

export function InterviewReadinessCard({
  interview,
}: {
  interview: DashboardInterview;
}) {
  if (interview.state === "prerequisites") {
    return (
      <Shell>
        <Prerequisites interview={interview} />
      </Shell>
    );
  }

  if (interview.state === "ready_to_start") {
    return (
      <Shell>
        <ReadyToStart />
      </Shell>
    );
  }

  return (
    <Shell>
      <Active interview={interview} />
    </Shell>
  );
}
