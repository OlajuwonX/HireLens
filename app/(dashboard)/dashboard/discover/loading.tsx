import { PageHeader } from "@/components/layout/page-header";
import { JobCardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageHeader
        title="Discover jobs"
        description="Open roles from the company job boards you follow, checked every day."
      />

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

      <span className="sr-only">Loading discovered jobs</span>
    </div>
  );
}
