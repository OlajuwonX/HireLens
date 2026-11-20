import { PageLoading } from "@/components/layout/page-loading";
import { FiltersRowSkeleton, JobCardSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageLoading title="Discover jobs" label="discovered jobs">
      <Skeleton className="h-10 w-64" />
      <FiltersRowSkeleton trailing={1} />
      <ul className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index}>
            <JobCardSkeleton />
          </li>
        ))}
      </ul>
    </PageLoading>
  );
}
