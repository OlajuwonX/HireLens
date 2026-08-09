"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import {
  JOB_SORT_OPTIONS,
  JOB_STATUSES,
  WORK_ARRANGEMENTS,
  jobSortLabels,
  jobStatusLabels,
  workArrangementLabels,
} from "@/features/jobs/constants";

export function JobFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

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
      router.replace(`/dashboard/jobs?${search.toString()}`);
    });
  }

  const hasFilters = ["q", "status", "arrangement", "sort"].some((key) =>
    params.get(key),
  );

  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(event) => event.preventDefault()}
      aria-busy={pending}
    >
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
        <Label htmlFor="job-search">Search</Label>
        <SearchInput
          id="job-search"
          name="q"
          placeholder="Title, company or location"
          defaultValue={params.get("q") ?? ""}
          onChange={(event) => apply({ q: event.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="job-status">Status</Label>
        <Select
          id="job-status"
          defaultValue={params.get("status") ?? ""}
          onChange={(event) => apply({ status: event.target.value })}
        >
          <option value="">All</option>
          {JOB_STATUSES.map((value) => (
            <option key={value} value={value}>
              {jobStatusLabels[value]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="job-arrangement">Arrangement</Label>
        <Select
          id="job-arrangement"
          defaultValue={params.get("arrangement") ?? ""}
          onChange={(event) => apply({ arrangement: event.target.value })}
        >
          <option value="">All</option>
          {WORK_ARRANGEMENTS.map((value) => (
            <option key={value} value={value}>
              {workArrangementLabels[value]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="job-sort">Sort</Label>
        <Select
          id="job-sort"
          defaultValue={params.get("sort") ?? "created_desc"}
          onChange={(event) => apply({ sort: event.target.value })}
        >
          {JOB_SORT_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {jobSortLabels[value]}
            </option>
          ))}
        </Select>
      </div>

      {hasFilters ? (
        <div className="sm:col-span-2 lg:col-span-4">
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() =>
              startTransition(() => router.replace("/dashboard/jobs"))
            }
          >
            Clear filters
          </Button>
        </div>
      ) : null}
    </form>
  );
}
