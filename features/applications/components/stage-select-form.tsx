import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { changeApplicationStageAction } from "@/features/applications/actions/application-actions";
import {
  APPLICATION_STAGES,
  applicationStageLabels,
  type ApplicationStage,
} from "@/features/applications/constants";

export function StageSelectForm({
  publicId,
  stage,
  labelId,
}: {
  publicId: string;
  stage: ApplicationStage;
  labelId: string;
}) {
  return (
    <form action={changeApplicationStageAction} className="flex gap-2">
      <input type="hidden" name="publicId" value={publicId} />
      <label className="sr-only" htmlFor={labelId}>
        Application stage
      </label>
      <Select
        id={labelId}
        name="stage"
        defaultValue={stage}
        className="h-8 w-auto min-w-32 text-meta"
      >
        {APPLICATION_STAGES.map((value) => (
          <option key={value} value={value}>
            {applicationStageLabels[value]}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="outline" size="compact">
        Move
      </Button>
    </form>
  );
}
