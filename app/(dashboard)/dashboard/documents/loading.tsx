import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  DocumentCardSkeleton,
  FiltersRowSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <PageHeader
        title="AI Documents"
        description="Everything you have saved from an analysis, ready to edit or download."
        action={
          <Button asChild>
            <Link href="/dashboard/jobs">Go to Saved Jobs</Link>
          </Button>
        }
      />

      <FiltersRowSkeleton trailing={2} />

      <ul aria-hidden className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index}>
            <DocumentCardSkeleton />
          </li>
        ))}
      </ul>

      <span className="sr-only">Loading AI documents</span>
    </div>
  );
}
