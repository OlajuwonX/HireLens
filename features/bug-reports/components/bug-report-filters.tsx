"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { Dropdown } from "@/components/ui/dropdown";
import { OPS_CONSOLE_PATH } from "@/features/admin/constants";
import {
  BUG_CATEGORIES,
  BUG_STATUSES,
  bugCategoryLabels,
  bugStatusLabels,
} from "../constants";

export function BugReportFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
    search.delete("page");

    for (const [key, value] of Object.entries(next)) {
      if (value) {
        search.set(key, value);
      } else {
        search.delete(key);
      }
    }

    startTransition(() => {
      router.replace(`${OPS_CONSOLE_PATH}?${search.toString()}`);
    });
  }

  return (
    <div
      aria-busy={pending}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <DebouncedSearch
          label="Search bug reports"
          placeholder="Search title or reporter"
          value={params.get("q") ?? ""}
          onSearch={(value) => apply({ q: value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0">
        <Dropdown
          label="Filter by status"
          className="sm:w-40"
          placeholder="All statuses"
          value={params.get("status") ?? ""}
          onChange={(value) => apply({ status: value === "ALL" ? "" : value })}
          options={[
            { value: "ALL", label: "All statuses" },
            ...BUG_STATUSES.map((value) => ({
              value,
              label: bugStatusLabels[value],
            })),
          ]}
        />

        <Dropdown
          label="Filter by category"
          className="sm:w-52"
          align="end"
          placeholder="All categories"
          value={params.get("category") ?? ""}
          onChange={(value) =>
            apply({ category: value === "ALL" ? "" : value })
          }
          options={[
            { value: "ALL", label: "All categories" },
            ...BUG_CATEGORIES.map((value) => ({
              value,
              label: bugCategoryLabels[value],
            })),
          ]}
        />
      </div>
    </div>
  );
}
