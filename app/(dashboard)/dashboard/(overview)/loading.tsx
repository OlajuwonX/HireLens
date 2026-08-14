import { PageTitle } from "@/components/layout/page-title";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageTitle title="Overview" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <p className="text-meta text-text-secondary">
            Here&rsquo;s where your job search stands.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-hidden>
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div
        aria-hidden
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>

      <div aria-hidden className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-card border border-border bg-surface p-4"
          >
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 4 }).map((__, row) => (
              <Skeleton key={row} className="h-3 w-full" />
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only">Loading your dashboard</span>
    </div>
  );
}
