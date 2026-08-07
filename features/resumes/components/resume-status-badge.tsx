import { StatusBadge } from "@/components/data-display/status-badge";
import type { Resume } from "@/lib/db/schema";

export function ResumeStatusBadge({ status }: { status: Resume["status"] }) {
  const labelByStatus: Record<Resume["status"], string> = {
    UPLOADING: "pending",
    PROCESSING: "pending",
    READY: "ready",
    FAILED: "failed",
    ARCHIVED: "archived",
  };

  return <StatusBadge status={labelByStatus[status]} />;
}
