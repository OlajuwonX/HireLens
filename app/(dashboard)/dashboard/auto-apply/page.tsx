import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { MetricCard } from "@/components/data-display/metric-card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { TaskCard } from "@/features/auto-apply/components/task-card";
import { QUEUE_ORDER, queueLabels } from "@/features/auto-apply/constants";
import { countCommittedToday, listRecentEvents, listTasksForUser } from "@/features/auto-apply/server/task.repository";
import { groupTasks } from "@/features/auto-apply/task-view";
import { dailySubmissionLimit, submissionsRemaining } from "@/lib/auto-apply/policy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auto Apply",
};

export const maxDuration = 60;

export default async function AutoApplyPage() {
  const user = await requireDatabaseUser();
  const [tasks, committed] = await Promise.all([
    listTasksForUser(user.id),
    countCommittedToday(user.id),
  ]);
  const events = await listRecentEvents({ userId: user.id, taskIds: tasks.map((task) => task.id) });
  const groups = groupTasks(tasks, events);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auto Apply"
        description="Prepare strong, truthful applications and approve each one before anything is sent."
      />

      <Alert tone="info">
        Nothing is submitted without your approval. Approved applications are sent by the local
        worker on your computer, which is coming next. Until then, apply with the job link and
        mark it applied.
      </Alert>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Ready" value={String(groups.READY?.length ?? 0)} />
        <MetricCard label="Needs you" value={String((groups.NEEDS_YOU?.length ?? 0) + (groups.MANUAL?.length ?? 0))} />
        <MetricCard label="Submitted" value={String(groups.SUBMITTED?.length ?? 0)} />
        <MetricCard label="Left today" value={`${submissionsRemaining(committed)}/${dailySubmissionLimit()}`} />
      </div>

      {QUEUE_ORDER.map((queue) => (
        <section key={queue} className="space-y-3">
          <h2 className="text-section-title font-semibold text-text-primary">
            {queueLabels[queue].title} ({groups[queue]?.length ?? 0})
          </h2>
          {groups[queue]?.length ? (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {groups[queue].map((task) => (
                <TaskCard key={task.publicId} task={task} />
              ))}
            </ul>
          ) : (
            <p className="text-meta text-text-secondary">{queueLabels[queue].empty}</p>
          )}
        </section>
      ))}
    </div>
  );
}
