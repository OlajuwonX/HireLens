import { BackButton } from "@/components/layout/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <BackButton href="/dashboard/resumes" label="Resumes" />

      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <p className="max-w-reading text-meta text-text-secondary">
          Every version in this resume group. The default is used when you
          create an application.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-card border border-border bg-surface">
            <div className="p-4">
              <Skeleton className="h-4 w-28" />
            </div>
            <ListRowSkeleton rows={3} />
          </div>
        </div>

        <div aria-hidden className="space-y-6">
          <div className="space-y-3 rounded-card border border-border bg-surface p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-3 rounded-card border border-border bg-surface p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      <span className="sr-only">Loading resume versions</span>
    </div>
  );
}
