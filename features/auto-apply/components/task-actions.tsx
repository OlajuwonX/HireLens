import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TaskState } from "@/lib/auto-apply/states";
import {
  approveTaskAction,
  cancelTaskAction,
  markSubmittedAction,
  revokeApprovalAction,
} from "../actions/task-actions";
import { PrepareButton } from "./prepare-button";
import { TaskActionButton } from "./task-action-button";

const PREPARABLE: TaskState[] = ["QUALIFIED", "PREPARING", "NEEDS_INPUT", "AWAITING_AI", "FAILED"];
const CANCELLABLE: TaskState[] = [...PREPARABLE, "READY_FOR_REVIEW", "APPROVED", "NEEDS_MANUAL_ACTION"];

export function TaskActions({
  publicId,
  state,
  sourceUrl,
}: {
  publicId: string;
  state: TaskState;
  sourceUrl: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PREPARABLE.includes(state) ? (
        <PrepareButton publicId={publicId} label={state === "QUALIFIED" ? "Prepare" : "Continue"} />
      ) : null}

      {state === "READY_FOR_REVIEW" ? (
        <>
          <TaskActionButton publicId={publicId} action={approveTaskAction} label="Approve" pendingLabel="Approving..." success="Approved." variant="primary" />
          <PrepareButton publicId={publicId} label="Prepare again" />
        </>
      ) : null}

      {state === "APPROVED" ? (
        <TaskActionButton publicId={publicId} action={revokeApprovalAction} label="Withdraw approval" pendingLabel="Withdrawing..." success="Approval withdrawn." />
      ) : null}

      {state === "NEEDS_MANUAL_ACTION" || state === "SUBMISSION_UNCONFIRMED" ? (
        <TaskActionButton publicId={publicId} action={markSubmittedAction} label="I applied" pendingLabel="Saving..." success="Marked as submitted." variant="primary" />
      ) : null}

      {sourceUrl && state !== "SUBMITTED" ? (
        <Button asChild size="compact" variant="outline">
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" aria-hidden />
            Job page
          </a>
        </Button>
      ) : null}

      {CANCELLABLE.includes(state) ? (
        <TaskActionButton publicId={publicId} action={cancelTaskAction} label="Remove" pendingLabel="Removing..." success="Removed from Auto Apply." />
      ) : null}
    </div>
  );
}
