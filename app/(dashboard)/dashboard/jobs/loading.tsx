import { PageHeader } from "@/components/layout/page-header";
import { FiltersRowSkeleton, JobCardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageHeader
        title="Applications"
        description="Every job you are working on, from saved to sent to a decision."
      />

      <div aria-hidden className="h-11 border-b border-border" />

      <FiltersRowSkeleton trailing={3} />

      <ul
        aria-hidden
        className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index}>
            <JobCardSkeleton />
          </li>
        ))}
      </ul>

      <span className="sr-only">Loading saved jobs</span>
    </div>
  );
}
