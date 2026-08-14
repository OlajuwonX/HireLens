import { BackButton } from "@/components/layout/back-button";
import { PageHeader } from "@/components/layout/page-header";
import { FormFieldSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <BackButton href="/dashboard/jobs" label="Saved Jobs" />

      <PageHeader
        title="Applications"
        description="Enter the job you are preparing for. HireLens saves it and analyses your resume against it in one step."
      />

      <div aria-hidden className="mx-auto w-full max-w-reading space-y-8">
        <section className="space-y-4">
          <h2 className="text-section-title font-semibold text-text-primary">
            Resume
          </h2>
          <FormFieldSkeleton />
        </section>

        <section className="space-y-4">
          <h2 className="text-section-title font-semibold text-text-primary">
            The job
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <FormFieldSkeleton key={index} />
            ))}
          </div>
          <FormFieldSkeleton tall />
        </section>
      </div>

      <span className="sr-only">Loading the application form</span>
    </div>
  );
}
