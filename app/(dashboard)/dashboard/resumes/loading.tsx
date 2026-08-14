import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ResumeCardSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageHeader
        title="Resumes"
        description="Manage resume records, processing states, and future resume versions."
        action={
          <Button asChild>
            <a href="/dashboard/resumes/new">New resume</a>
          </Button>
        }
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
