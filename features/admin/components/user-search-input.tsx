"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { DebouncedSearch } from "@/components/ui/debounced-search";
import { ADMIN_ROOT_PATH } from "@/features/admin/constants";

export function UserSearchInput() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(value: string) {
    const search = new URLSearchParams(params.toString());
    search.delete("page");

    if (value) {
      search.set("q", value);
    } else {
      search.delete("q");
    }

    startTransition(() => {
      router.replace(`${ADMIN_ROOT_PATH}/users?${search.toString()}`);
    });
  }

  return (
    <div aria-busy={pending} className="max-w-sm">
      <DebouncedSearch
        label="Search users"
        placeholder="Search name or email"
        value={params.get("q") ?? ""}
        onSearch={apply}
      />
    </div>
  );
}
