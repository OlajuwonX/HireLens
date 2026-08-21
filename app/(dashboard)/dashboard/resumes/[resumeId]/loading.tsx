import { BackButton } from "@/components/layout/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <BackButton href="/dashboard/resumes" label="Resumes" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-reading text-meta text-text-secondary">
          Every resume filed under this job title, including the ones improved
          by AI. The default is used when you create an application.
        </p>

        <div aria-hidden className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <div className="flex flex-1 gap-2 sm:flex-none">
            <Skeleton className="h-10 flex-1 sm:w-40" />
            <Skeleton className="h-10 flex-1 sm:w-28" />
          </div>
        </div>
      </div>

      <div aria-hidden className="rounded-card border border-border bg-surface">
        <div className="p-5">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="border-t border-border">
          <ListRowSkeleton rows={3} />
        </div>
      </div>

      <span className="sr-only">Loading resumes for this job title</span>
    </div>
  );
}
