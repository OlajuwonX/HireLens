"use client";

import { DateRangePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/components/ui/dropdown";
import {
  APPLICATION_SORT_OPTIONS,
  APPLICATION_TABS,
  applicationSortLabels,
  applicationTabLabels,
} from "@/features/applications/constants";
import { totalSavedCount } from "@/features/applications/toolbar";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function ApplicationFilters({
  counts,
  action,
}: {
  counts: Record<string, number>;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const activeTab = params.get("tab") ?? "PENDING";
  const activeSort = params.get("sort") ?? "activity_desc";
  const totalCount = totalSavedCount(counts);

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
    search.delete("open");
    search.delete("cursor");
    search.delete("q");

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

  return (
    <div
      aria-busy={pending}
      className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="grid grid-cols-2 gap-2 sm:flex sm:min-w-0 sm:flex-1 sm:flex-wrap sm:items-center">
        <Dropdown
          label="Sort saved jobs"
          className="sm:w-44"
          value={activeSort}
          onChange={(value) =>
            apply({ sort: value === "activity_desc" ? "" : value })
          }
          options={APPLICATION_SORT_OPTIONS.map((value) => ({
            value,
            label: applicationSortLabels[value],
          }))}
        />

        <Dropdown
          label="Filter by status"
          className="sm:w-40"
          value={activeTab}
          onChange={(value) => apply({ tab: value === "PENDING" ? "" : value })}
          options={APPLICATION_TABS.map((tab) => ({
            value: tab,
            label: applicationTabLabels[tab],
            hint: `${tab === "ALL" ? totalCount : (counts[tab] ?? 0)} saved`,
          }))}
        />

        <DateRangePicker
          className="col-span-2 sm:col-span-1 sm:w-56"
          placeholder="Any date added"
          from={params.get("from") ?? ""}
          to={params.get("to") ?? ""}
          onChange={({ from, to }) => apply({ from, to })}
        />
      </div>

      {action ? <div className="flex shrink-0">{action}</div> : null}
    </div>
  );
}
