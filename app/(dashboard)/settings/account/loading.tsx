import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <BackButton href="/dashboard" label="Dashboard" />

      <PageHeader
        title="Account settings"
        description="Your profile and the ways you can sign in to HireLens."
      />

      <div
        aria-hidden
        className="space-y-4 rounded-card border border-border bg-surface p-4 sm:p-5"
      >
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>

      <span className="sr-only">Loading account settings</span>
    </div>
  );
}
