import { PageHeader } from "@/components/layout/page-header";
import { ResumeCardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageHeader
        title="Resumes"
        description="Upload a resume under a job title. Every version you add and every AI-improved resume for that role stays in the same place."
      />

      <ul
        aria-hidden
        className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index}>
            <ResumeCardSkeleton />
          </li>
        ))}
      </ul>

      <span className="sr-only">Loading resumes</span>
    </div>
  );
}
