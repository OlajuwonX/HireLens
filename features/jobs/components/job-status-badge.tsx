import { Badge } from "@/components/ui/badge";
import { jobStatusLabels, type JobStatus } from "@/features/jobs/constants";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge tone={status === "ARCHIVED" ? "neutral" : "green"}>
      {jobStatusLabels[status]}
    </Badge>
  );
}
