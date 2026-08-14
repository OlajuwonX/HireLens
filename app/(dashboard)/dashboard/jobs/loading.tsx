import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FiltersRowSkeleton, JobCardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageHeader
        title="Saved Jobs"
        description="Everything you are tracking, from pending through to a decision."
        action={
          <Button asChild>
            <Link href="/dashboard/applications">Create application</Link>
          </Button>
        }
      />

      <FiltersRowSkeleton trailing={3} />

      <ul
        aria-hidden
        className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4"
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
