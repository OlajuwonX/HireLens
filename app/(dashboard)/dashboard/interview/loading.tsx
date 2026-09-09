import { PageTitle } from "@/components/layout/page-title";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageTitle title="Interview" />

      <div aria-hidden className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="space-y-2 rounded-card border border-border bg-surface p-5"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      <div aria-hidden className="space-y-3">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-card border border-border bg-surface p-5"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-3/4" />
            {Array.from({ length: 4 }).map((__, row) => (
              <Skeleton key={row} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only">Loading your interview set</span>
    </div>
  );
}
