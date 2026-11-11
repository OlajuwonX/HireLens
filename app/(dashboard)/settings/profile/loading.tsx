import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { FormFieldSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <BackButton href="/dashboard" label="Dashboard" />

      <PageHeader
        title="Career profile"
        description="The facts HireLens uses to match you with jobs and fill in applications. Only you can see them."
      />

      <div
        aria-hidden
        className="grid gap-4 rounded-card border border-border bg-surface p-4 sm:grid-cols-2 sm:p-5"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <FormFieldSkeleton key={index} />
        ))}
      </div>

      <span className="sr-only">Loading career profile</span>
    </div>
  );
}
