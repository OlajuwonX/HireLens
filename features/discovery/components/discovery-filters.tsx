"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { Dropdown } from "@/components/ui/dropdown";
import { DISCOVERY_PATH } from "../constants";

const arrangements = [
  { value: "ALL", label: "Any arrangement" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ON_SITE", label: "On-site" },
];

export function DiscoveryFilters({ q, arrangement }: { q: string; arrangement: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const update = (key: string, value: string) => {
    const search = new URLSearchParams(params.toString());

    if (value && value !== "ALL") {
      search.set(key, value);
    } else {
      search.delete(key);
    }

    router.replace(`${DISCOVERY_PATH}?${search.toString()}`);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <DebouncedSearch
        value={q}
        onSearch={(next) => update("q", next)}
        label="Search discovered jobs"
        placeholder="Search title or company"
        className="sm:max-w-sm"
      />
      <Dropdown
        label="Work arrangement"
        value={arrangement || "ALL"}
        onChange={(value) => update("arrangement", value)}
        options={arrangements}
      />
    </div>
  );
}
