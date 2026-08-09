import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { changeApplicationStatusAction } from "@/features/applications/actions/application-actions";
import {
  APPLICATION_STATUSES,
  applicationStatusLabels,
  type ApplicationStatus,
} from "@/features/applications/constants";

export function StatusSelectForm({
  publicId,
  status,
  selectId,
}: {
  publicId: string;
  status: ApplicationStatus;
  selectId: string;
}) {
  return (
    <form action={changeApplicationStatusAction} className="flex gap-2">
      <input type="hidden" name="publicId" value={publicId} />
      <label className="sr-only" htmlFor={selectId}>
        Application status
      </label>
      <Select
        id={selectId}
        name="status"
        defaultValue={status}
        className="h-8 w-auto min-w-28 text-meta"
      >
        {APPLICATION_STATUSES.map((value) => (
          <option key={value} value={value}>
            {applicationStatusLabels[value]}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="outline" size="compact">
        Update
      </Button>
    </form>
  );
}
