"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { Dropdown } from "@/components/ui/dropdown";
import { ADMIN_ACTIONS, adminActionLabels } from "@/features/admin/constants";

const AUDIT_LOG_PATH = "/admin/audit-log";
const ACTION_VALUES = Object.values(ADMIN_ACTIONS);

export function AuditLogFilters() {
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
      router.replace(`${AUDIT_LOG_PATH}?${search.toString()}`);
    });
  }

  return (
    <div
      aria-busy={pending}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <DebouncedSearch
          label="Search by actor"
          placeholder="Search actor email"
          value={params.get("actor") ?? ""}
          onSearch={(value) => apply({ actor: value })}
        />
      </div>

      <Dropdown
        label="Filter by action"
        className="sm:w-56"
        align="end"
        placeholder="All actions"
        value={params.get("action") ?? ""}
        onChange={(value) => apply({ action: value === "ALL" ? "" : value })}
        options={[
          { value: "ALL", label: "All actions" },
          ...ACTION_VALUES.map((value) => ({
            value,
            label: adminActionLabels[value],
          })),
        ]}
      />
    </div>
  );
}
