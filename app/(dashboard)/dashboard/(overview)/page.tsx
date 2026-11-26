import { PageTitle } from "@/components/layout/page-title";
import { Button } from "@/components/ui/button";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { TodayList } from "@/features/dashboard/components/today-list";
import { getDashboardSummary } from "@/features/dashboard/server/dashboard.service";
import { readTodaySignals } from "@/features/dashboard/server/today.repository";
import { buildTodayItems, plural } from "@/features/dashboard/today-items";
import { DailyInterviewModal } from "@/features/interviews/components/daily-interview-modal";
import { InterviewReadinessCard } from "@/features/interviews/components/interview-readiness-card";
import { getDailyInterviewPrompt } from "@/features/interviews/server/interview-daily.service";
import { AddResumeDialog } from "@/features/resumes/components/add-resume-dialog";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Today",
};

function firstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] ?? null;
}

export default async function TodayPage() {
  const user = await requireDatabaseUser();
  const now = new Date();
  const [summary, dailyPrompt, signals] = await Promise.all([
    getDashboardSummary(user.id),
    getDailyInterviewPrompt(user.id),
    readTodaySignals(user.id, now),
  ]);
  const items = buildTodayItems(signals, now);
  const name = firstName(user.name);
  const primary = summary.resumeGroupCount === 0 ? "resume" : items.length === 0 ? "discover" : null;
  const dateLabel = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className="mx-auto max-w-reading space-y-10">
      {dailyPrompt.due ? <DailyInterviewModal prompt={dailyPrompt} /> : null}

      <PageTitle title="Today" />

      <header className="space-y-2">
        <p className="font-mono text-system uppercase text-text-muted">{dateLabel}</p>
        <h2 className="text-page-title font-semibold text-text-primary">
          {items.length === 0
            ? `You are up to date${name ? `, ${name}` : ""}.`
            : `${plural(items.length, "thing needs", "things need")} you${name ? `, ${name}` : ""}.`}
        </h2>
        {items.length === 0 ? (
          <p className="text-body text-text-secondary">
            Nothing is waiting on you. Find new roles, or add a job you already have in mind.
          </p>
        ) : null}
      </header>

      {items.length > 0 ? <TodayList items={items} /> : null}

      <div className="flex flex-wrap gap-2">
        <span data-onboarding="add-resume" className="inline-flex">
          <AddResumeDialog
            options={summary.resumeTitles}
            label="Add resume"
            variant={primary === "resume" ? "primary" : "outline"}
            redirectTo="/dashboard/resumes"
          />
        </span>
        <span data-onboarding="create-application" className="inline-flex">
          <Button asChild variant="outline">
            <Link href="/dashboard/applications">Add a job</Link>
          </Button>
        </span>
        <Button asChild variant={primary === "discover" ? "primary" : "outline"}>
          <Link href="/dashboard/discover">Find jobs</Link>
        </Button>
      </div>

      <InterviewReadinessCard interview={summary.interview} />

      {summary.recentApplications.length > 0 ? (
        <section aria-labelledby="recent-heading" className="space-y-3">
          <h2 id="recent-heading" className="font-mono text-system uppercase text-text-muted">
            Recently active
          </h2>
          <ul className="space-y-2">
            {summary.recentApplications.map((application) => (
              <li key={application.publicId}>
                <Link
                  href={`/dashboard/jobs?open=${application.publicId}`}
                  className="text-meta text-text-primary underline-offset-4 hover:underline"
                >
                  {application.title} <span className="text-text-secondary">at {application.company}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p data-numeric className="border-t border-border pt-4 font-mono text-system uppercase text-text-muted">
        {[
          plural(summary.resumeGroupCount, "resume", "resumes"),
          plural(summary.applicationCount, "application", "applications"),
          summary.averageMatchScore === null ? null : `average match ${summary.averageMatchScore}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
}
