import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { JobFilters } from "@/features/jobs/components/job-filters";
import { JobList } from "@/features/jobs/components/job-list";
import { jobFiltersSchema } from "@/features/jobs/schemas/job.schema";
import { getJobBoard } from "@/features/jobs/server/job.service";

export const metadata: Metadata = {
  title: "Saved Jobs",
};

type JobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const user = await requireDatabaseUser();
  const raw = await searchParams;

  const parsed = jobFiltersSchema.safeParse({
    q: raw.q,
    status: raw.status,
    arrangement: raw.arrangement,
    sort: raw.sort ?? "created_desc",
  });

  const filters = parsed.success
    ? parsed.data
    : jobFiltersSchema.parse({ sort: "created_desc" });

  const jobs = await getJobBoard({ userId: user.id, filters });
  const isFiltered = Boolean(
    filters.q || filters.status || filters.arrangement,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Jobs"
        description="Opportunities you have saved, with the descriptions HireLens analyses against."
        action={
          <Button asChild>
            <Link href="/dashboard/jobs/new">Save a job</Link>
          </Button>
        }
      />

      <Suspense fallback={null}>
        <JobFilters />
      </Suspense>

      {jobs.length === 0 ? (
        <EmptyState
          title={isFiltered ? "No jobs match those filters" : "No saved jobs yet"}
          description={
            isFiltered
              ? "Try clearing the search or changing the filters."
              : "Save a job posting to analyse your resume against its requirements."
          }
          action={
            isFiltered ? null : (
              <Button asChild>
                <Link href="/dashboard/jobs/new">Save a job</Link>
              </Button>
            )
          }
        />
      ) : (
        <JobList jobs={jobs} />
      )}
    </div>
  );
}
