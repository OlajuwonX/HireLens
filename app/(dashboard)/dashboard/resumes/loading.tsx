import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeCardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageHeader
        title="Resumes"
        description="Every resume you upload sits under a job title. Versions you add and AI-improved resumes for that role stay in the same place."
        action={<Skeleton aria-hidden className="h-10 w-full sm:w-36" />}
      />

      <div className="space-y-4" aria-hidden>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <Skeleton className="h-10 min-w-0 flex-1" />
          <Skeleton className="h-10 lg:w-56 lg:shrink-0" />
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index}>
              <ResumeCardSkeleton />
            </li>
          ))}
        </ul>
      </div>

      <span className="sr-only">Loading resumes</span>
    </div>
  );
}
