import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FiltersRowSkeleton,
  ListRowSkeleton,
  MetricCardSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageHeader
        title="Bug reports"
        description="Everything reported from the Help screen, newest first."
      />

      <div
        aria-hidden
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>

      <FiltersRowSkeleton trailing={2} />
      <ListRowSkeleton rows={6} />
      <Skeleton className="sr-only" />

      <span className="sr-only">Loading bug reports</span>
    </div>
  );
}
