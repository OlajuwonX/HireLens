"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import {
  APPLICATION_SORT_OPTIONS,
  APPLICATION_TABS,
  applicationSortLabels,
  applicationTabLabels,
} from "@/features/applications/constants";

export function ApplicationFilters({
  counts,
}: {
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const activeTab = params.get("tab") ?? "PENDING";

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
    search.delete("open");

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

  const totalCount = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="space-y-3" aria-busy={pending}>
      <div
        role="tablist"
        aria-label="Application status"
        className="flex flex-wrap gap-1 overflow-x-auto rounded-control border border-border bg-surface p-1"
      >
        {APPLICATION_TABS.map((tab) => {
          const count = tab === "ALL" ? totalCount : (counts[tab] ?? 0);

          return (
            <Button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              variant={activeTab === tab ? "segmentActive" : "segment"}
              size="compact"
              onClick={() => apply({ tab: tab === "PENDING" ? "" : tab })}
              className="gap-2 rounded-control"
            >
              {applicationTabLabels[tab]}
              <span className="font-mono text-system tabular-nums opacity-70">
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="application-search">Search</Label>
          <SearchInput
            id="application-search"
            placeholder="Job title or company"
            defaultValue={params.get("q") ?? ""}
            onChange={(event) => apply({ q: event.target.value })}
          />
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
