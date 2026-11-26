import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { WORKER_SETTINGS_PATH } from "@/features/worker/constants";
import { dailySubmissionLimit, submissionsRemaining } from "@/lib/auto-apply/policy";
import type { TaskView } from "../task-view";
import { TaskCard } from "./task-card";

export function TaskQueue({
  title,
  empty,
  tasks,
  committedToday,
}: {
  title: string;
  empty: string;
  tasks: TaskView[];
  committedToday: number;
}) {
  return (
    <section aria-label={title} className="space-y-4">
      <p className="text-meta text-text-secondary">
        Nothing is sent without your approval.{" "}
        <span data-numeric className="font-mono text-system uppercase text-text-muted">
          {submissionsRemaining(committedToday)} of {dailySubmissionLimit()} left today
        </span>
        <span className="block sm:inline">
          {" "}
          Approved applications are filled by the extension or the{" "}
          <Link href={WORKER_SETTINGS_PATH} className="underline underline-offset-4">
            local worker
          </Link>
          , and you press submit yourself.
        </span>
      </p>

      {tasks.length === 0 ? (
        <EmptyState title={`Nothing in ${title.toLowerCase()}`} description={empty} />
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard key={task.publicId} task={task} />
          ))}
        </ul>
      )}
    </section>
  );
}
