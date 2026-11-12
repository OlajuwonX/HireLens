import { Badge } from "@/components/ui/badge";
import type { TaskState } from "@/lib/auto-apply/states";
import type { TaskView } from "../task-view";
import { TaskActions } from "./task-actions";

const stateLabels: Record<TaskState, string> = {
  DISCOVERED: "Discovered",
  QUALIFIED: "Queued",
  PREPARING: "Preparing",
  AWAITING_AI: "Waiting for AI capacity",
  NEEDS_INPUT: "Needs your input",
  NEEDS_MANUAL_ACTION: "Finish manually",
  READY_FOR_REVIEW: "Ready for approval",
  APPROVED: "Approved",
  SUBMITTING: "Submitting",
  SUBMITTED: "Submitted",
  SUBMISSION_UNCONFIRMED: "Submission not confirmed",
  FAILED: "Failed",
  CANCELLED: "Removed",
};

export function TaskCard({ task }: { task: TaskView }) {
  return (
    <li className="space-y-3 rounded-card border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-meta font-semibold text-text-primary">{task.title}</p>
          <p className="truncate text-label text-text-secondary">{task.company}</p>
        </div>
        <Badge tone="neutral">{stateLabels[task.state]}</Badge>
      </div>

      {task.stateReason ? <p className="text-meta text-text-primary">{task.stateReason}</p> : null}

      {task.needs.length > 0 ? (
        <p className="text-meta text-text-secondary">
          <span className="font-medium text-text-primary">Needed: </span>
          {task.needs.join(", ")}
        </p>
      ) : null}

      {task.history.length > 0 ? (
        <ol className="space-y-0.5 border-l border-border pl-3 text-label text-text-muted">
          {task.history.map((event, index) => (
            <li key={index}>{event}</li>
          ))}
        </ol>
      ) : null}

      <TaskActions publicId={task.publicId} state={task.state} sourceUrl={task.sourceUrl} />
    </li>
  );
}
