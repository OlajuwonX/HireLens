"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DateRangePicker } from "@/components/ui/date-picker";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { Dropdown } from "@/components/ui/dropdown";
import { DOCUMENT_TYPES, documentTypeLabels } from "../constants";

export function DocumentFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
    search.delete("cursor");

    for (const [key, value] of Object.entries(next)) {
      if (value) {
        search.set(key, value);
      } else {
        search.delete(key);
      }
    }

    startTransition(() => {
      router.replace(`/dashboard/documents?${search.toString()}`);
    });
  }

  return (
    <div
      aria-busy={pending}
      className="flex flex-col gap-2 lg:flex-row lg:items-center"
    >
      <div className="min-w-0 flex-1">
        <DebouncedSearch
          label="Search AI documents"
          placeholder="Search company or job title"
          value={params.get("q") ?? ""}
          onSearch={(value) => apply({ q: value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 lg:flex lg:shrink-0">
        <Dropdown
          label="Filter by document type"
          className="lg:w-48"
          placeholder="All types"
          value={params.get("type") ?? ""}
          onChange={(value) => apply({ type: value === "ALL" ? "" : value })}
          options={[
            { value: "ALL", label: "All types" },
            ...DOCUMENT_TYPES.map((type) => ({
              value: type,
              label: documentTypeLabels[type],
            })),
          ]}
        />

        <DateRangePicker
          className="lg:w-60"
          placeholder="Any date"
          from={params.get("from") ?? ""}
          to={params.get("to") ?? ""}
          onChange={({ from, to }) => apply({ from, to })}
        />
      </div>
    </div>
  );
}
