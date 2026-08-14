import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFieldSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <BackButton href="/dashboard" label="Dashboard" />

      <PageHeader
        title="Help"
        description="How HireLens works, and how to tell us when something goes wrong."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-3" aria-hidden>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-card" />
          ))}
        </div>

        <div className="space-y-4 rounded-card border border-border bg-surface p-4 sm:p-5">
          <p className="text-section-title font-semibold text-text-primary">
            Report a problem
          </p>
          <div className="space-y-4" aria-hidden>
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <FormFieldSkeleton tall />
          </div>
        </div>
      </div>

      <span className="sr-only">Loading help</span>
    </div>
  );
}
