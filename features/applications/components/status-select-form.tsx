"use client";

import { useState, useTransition } from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { notify } from "@/components/ui/toast";
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
  const [current, setCurrent] = useState<ApplicationStatus>(status);
  const [pending, startTransition] = useTransition();

  return (
    <Dropdown
      id={selectId}
      label="Application status"
      className="w-40"
      disabled={pending}
      value={current}
      onChange={(next) => {
        const previous = current;

        setCurrent(next as ApplicationStatus);

        const formData = new FormData();
        formData.set("publicId", publicId);
        formData.set("status", next);

        startTransition(async () => {
          try {
            await changeApplicationStatusAction(formData);
            notify.success(
              `Status updated to ${applicationStatusLabels[next as ApplicationStatus]}.`,
            );
          } catch {
            setCurrent(previous);
            notify.error("That status could not be updated.");
          }
        });
      }}
      options={APPLICATION_STATUSES.map((value) => ({
        value,
        label: applicationStatusLabels[value],
      }))}
    />
  );
}
