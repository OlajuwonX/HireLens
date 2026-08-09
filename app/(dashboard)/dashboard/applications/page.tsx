import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { ApplicationFilters } from "@/features/applications/components/application-filters";
import { ApplicationList } from "@/features/applications/components/application-list";
import { ApplicationPipeline } from "@/features/applications/components/application-pipeline";
import { applicationFiltersSchema } from "@/features/applications/schemas/application.schema";
import { getApplicationBoard } from "@/features/applications/server/application.service";

export const metadata: Metadata = {
  title: "Applications",
};

type ApplicationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ApplicationsPage({
  searchParams,
}: ApplicationsPageProps) {
  const user = await requireDatabaseUser();
  const raw = await searchParams;

  const parsed = applicationFiltersSchema.safeParse({
    q: raw.q,
    stage: raw.stage,
    sort: raw.sort ?? "activity_desc",
    view: raw.view ?? "list",
  });

  const filters = parsed.success
    ? parsed.data
    : applicationFiltersSchema.parse({});

  const rows = await getApplicationBoard({ userId: user.id, filters });
  const isFiltered = Boolean(filters.q || filters.stage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Every job you are tracking, from saved through to offer."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/jobs">Track a saved job</Link>
          </Button>
        }
      />

      <Suspense fallback={null}>
        <ApplicationFilters />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState
          title={
            isFiltered
              ? "No applications match those filters"
              : "No applications yet"
          }
          description={
            isFiltered
              ? "Try clearing the search or changing the stage."
              : "Save a job, then track it to follow it from applied through to offer."
          }
          action={
            isFiltered ? null : (
              <Button asChild>
                <Link href="/dashboard/jobs">Go to saved jobs</Link>
              </Button>
            )
          }
        />
      ) : filters.view === "pipeline" ? (
        <ApplicationPipeline rows={rows} />
      ) : (
        <ApplicationList rows={rows} />
      )}
    </div>
  );
}
