"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { notify } from "@/components/ui/toast";
import { regionDetails, type JobRegion } from "@/lib/discovery/regions";
import { setJobRegionAction } from "../actions/source-actions";

export function RegionToggle({ region, enabled }: { region: JobRegion; enabled: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const details = regionDetails[region];
  const save = useMutation({
    mutationFn: (next: boolean) => setJobRegionAction({ region, enabled: next }),
    onSuccess: (result, next) => {
      if (!result.ok) {
        setChecked(!next);
        notify.error("That setting could not be saved.");
        return;
      }

      router.refresh();
    },
    onError: (_error, next) => {
      setChecked(!next);
      notify.error("That setting could not be saved. Please try again.");
    },
  });

  return (
    <label className="flex items-start gap-3 text-meta">
      <Checkbox
        className="mt-0.5"
        checked={checked}
        disabled={save.isPending}
        onChange={(event) => {
          setChecked(event.target.checked);
          save.mutate(event.target.checked);
        }}
      />
      <span>
        <span className="font-medium text-text-primary">Include jobs in {details.label}</span>
        <span className="block text-text-secondary">From {details.sources}.</span>
      </span>
    </label>
  );
}
