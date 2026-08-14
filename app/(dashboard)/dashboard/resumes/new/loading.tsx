import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { FormFieldSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <BackButton href="/dashboard/resumes" label="Resumes" />

      <PageHeader
        title="New resume"
        description="Create the metadata record first. File upload will attach to this flow through the storage provider."
      />

      <div className="rounded-card border border-border bg-surface p-4 sm:p-5">
        <p className="text-section-title font-semibold text-text-primary">
          Resume details
        </p>
        <div className="mt-4 space-y-4" aria-hidden>
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
      </div>

      <span className="sr-only">Loading the resume form</span>
    </div>
  );
}
