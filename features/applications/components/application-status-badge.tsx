import { Badge } from "@/components/ui/badge";
import {
  applicationStatusLabels,
  applicationStatusTone,
  type ApplicationStatus,
} from "@/features/applications/constants";

export function ApplicationStatusBadge({
  status,
}: {
  status: ApplicationStatus;
}) {
  return (
    <Badge tone={applicationStatusTone[status]}>
      {applicationStatusLabels[status]}
    </Badge>
  );
}
