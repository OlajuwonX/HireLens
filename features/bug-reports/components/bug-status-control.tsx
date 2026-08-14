"use client";

import { useState, useTransition } from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { notify } from "@/components/ui/toast";
import { updateBugStatusAction } from "../actions/bug-report-actions";
import { BUG_STATUSES, bugStatusLabels } from "../constants";
import type { BugStatus } from "@/lib/db/schema";

export function BugStatusControl({
  publicId,
  status,
}: {
  publicId: string;
  status: BugStatus;
}) {
  const [current, setCurrent] = useState<BugStatus>(status);
  const [pending, startTransition] = useTransition();

  return (
    <Dropdown
      label="Report status"
      className="w-44"
      disabled={pending}
      value={current}
      onChange={(next) => {
        const previous = current;

        setCurrent(next as BugStatus);

        const formData = new FormData();
        formData.set("publicId", publicId);
        formData.set("status", next);

        startTransition(async () => {
          try {
            await updateBugStatusAction(formData);
            notify.success(
              `Marked as ${bugStatusLabels[next as BugStatus].toLowerCase()}.`,
            );
          } catch {
            setCurrent(previous);
            notify.error("That status could not be updated.");
          }
        });
      }}
      options={BUG_STATUSES.map((value) => ({
        value,
        label: bugStatusLabels[value],
      }))}
    />
  );
}
