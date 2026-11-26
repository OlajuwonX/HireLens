"use client";

import { useSearchParams } from "next/navigation";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { DISCOVERY_PATH } from "../constants";
import { ArrangementChips } from "./arrangement-chips";
import { useDiscoveryRefresh } from "./refresh-context";

export function DiscoveryFilters({
  q,
  arrangement,
  counts,
}: {
  q: string;
  arrangement: string;
  counts: Record<string, number>;
}) {
  const { replace } = useDiscoveryRefresh();
  const params = useSearchParams();

  const update = (key: string, value: string) => {
    const search = new URLSearchParams(params.toString());

    if (value) {
      search.set(key, value);
    } else {
      search.delete(key);
    }

    replace(`${DISCOVERY_PATH}?${search.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <DebouncedSearch
        value={q}
        onSearch={(next) => update("q", next)}
        label="Search discovered jobs"
        placeholder="Search title or company"
        className="sm:max-w-sm"
      />
      <ArrangementChips active={arrangement} counts={counts} onSelect={(value) => update("arrangement", value)} />
    </div>
  );
}
