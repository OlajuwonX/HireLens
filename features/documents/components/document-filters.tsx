"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Dropdown } from "@/components/ui/dropdown";
import { DOCUMENT_TYPES, documentTypeLabels } from "../constants";

export function DocumentFilters({ action }: { action?: React.ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString());
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
      router.replace(`/dashboard/documents?${search.toString()}`);
    });
  }

  return (
    <div
      aria-busy={pending}
      className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="grid grid-cols-2 gap-2 sm:flex sm:min-w-0 sm:flex-1 sm:flex-wrap sm:items-center">
        <Dropdown
          label="Filter by document type"
          className="sm:w-48"
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
          className="sm:w-60"
          placeholder="Any date"
          from={params.get("from") ?? ""}
          to={params.get("to") ?? ""}
          onChange={({ from, to }) => apply({ from, to })}
        />
      </div>

      {action ? <div className="flex shrink-0">{action}</div> : null}
    </div>
  );
}
