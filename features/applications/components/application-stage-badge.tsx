import { Badge } from "@/components/ui/badge";
import {
  applicationStageLabels,
  applicationStageTone,
  type ApplicationStage,
} from "@/features/applications/constants";

export function ApplicationStageBadge({ stage }: { stage: ApplicationStage }) {
  return (
    <Badge tone={applicationStageTone[stage]}>
      {applicationStageLabels[stage]}
    </Badge>
  );
}
