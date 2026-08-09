"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import {
  APPLICATION_SORT_OPTIONS,
  APPLICATION_STAGES,
  applicationSortLabels,
  applicationStageLabels,
} from "@/features/applications/constants";

export function ApplicationFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const view = params.get("view") === "pipeline" ? "pipeline" : "list";

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());

    for (const [key, value] of Object.entries(next)) {
      if (value) {
        search.set(key, value);
      } else {
        search.delete(key);
      }
    }

    startTransition(() => {
      router.replace(`/dashboard/applications?${search.toString()}`);
    });
  }

  return (
    <div className="space-y-3" aria-busy={pending}>
      <div
        role="radiogroup"
        aria-label="View"
        className="inline-flex rounded-control border border-border bg-surface"
      >
        {(["list", "pipeline"] as const).map((value) => (
          <Button
            key={value}
            variant={view === value ? "segmentActive" : "segment"}
            size="compact"
            role="radio"
            aria-checked={view === value}
            onClick={() => apply({ view: value === "list" ? "" : value })}
          >
            {value === "list" ? "List" : "Pipeline"}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="application-search">Search</Label>
          <SearchInput
            id="application-search"
            placeholder="Role or company"
            defaultValue={params.get("q") ?? ""}
            onChange={(event) => apply({ q: event.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="application-stage">Stage</Label>
          <Select
            id="application-stage"
            defaultValue={params.get("stage") ?? ""}
            onChange={(event) => apply({ stage: event.target.value })}
          >
            <option value="">All</option>
            {APPLICATION_STAGES.map((value) => (
              <option key={value} value={value}>
                {applicationStageLabels[value]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="application-sort">Sort</Label>
          <Select
            id="application-sort"
            defaultValue={params.get("sort") ?? "activity_desc"}
            onChange={(event) => apply({ sort: event.target.value })}
          >
            {APPLICATION_SORT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {applicationSortLabels[value]}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
