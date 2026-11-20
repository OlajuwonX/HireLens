"use client";

import type { ReactNode } from "react";
import { JobCardSkeleton } from "@/components/ui/skeletons";
import { useDiscoveryRefresh } from "./refresh-context";

const SKELETON_COUNT = 8;

export function RefreshingResults({ children }: { children: ReactNode }) {
  const { checking, loading } = useDiscoveryRefresh();

  if (!loading) {
    return children;
  }

  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <p className="text-meta text-text-secondary">
        {checking ? "Checking job sources for new roles. This can take up to a minute." : "Loading jobs..."}
      </p>
      <ul className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <li key={index}>
            <JobCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
