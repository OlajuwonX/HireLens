import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { LoadMore } from "@/components/ui/load-more";
import { ApplicationFilters } from "@/features/applications/components/application-filters";
import { ApplicationCardGrid } from "@/features/applications/components/application-card-grid";
import { SavedJobDrawer } from "@/features/applications/components/saved-job-drawer";
import { applicationFiltersSchema } from "@/features/applications/schemas/application.schema";
import {
  getApplicationBoard,
  getStatusCounts,
} from "@/features/applications/server/application.service";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Saved Jobs",
};

type SavedJobsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SavedJobsPage({
  searchParams,
}: SavedJobsPageProps) {
  const user = await requireDatabaseUser();
  const raw = await searchParams;

  const parsed = applicationFiltersSchema.safeParse({
    q: raw.q,
    tab: raw.tab ?? "PENDING",
    sort: raw.sort ?? "activity_desc",
    from: raw.from,
    to: raw.to,
  });

  const filters = parsed.success
    ? parsed.data
    : applicationFiltersSchema.parse({});

  const page = Number.parseInt(
    typeof raw.page === "string" ? raw.page : "1",
    10,
  );
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

  const [rows, counts] = await Promise.all([
    getApplicationBoard({
      userId: user.id,
      filters,
      limit: PAGE_SIZE + 1,
      offset: (currentPage - 1) * PAGE_SIZE,
    }),
    getStatusCounts(user.id),
  ]);

  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.tab !== "PENDING") query.set("tab", filters.tab);
  if (filters.sort !== "activity_desc") query.set("sort", filters.sort);

  const openId = typeof raw.open === "string" ? raw.open : null;

  const visible = rows.slice(0, PAGE_SIZE);
  const hasMore = rows.length > PAGE_SIZE;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Jobs"
        description="Everything you are tracking, from pending through to a decision."
        action={
          <Button asChild>
            <Link href="/dashboard/applications">Create application</Link>
          </Button>
        }
      />

      <Suspense fallback={null}>
        <ApplicationFilters counts={counts} />
      </Suspense>

      {visible.length === 0 ? (
        <EmptyState
          title={filters.q ? "Nothing matches that search" : "No applications yet"}
          description={
            filters.q
              ? "Try a different search or another status tab."
              : "Create an application to save the job and analyse your resume against it."
          }
          action={
            filters.q ? null : (
              <Button asChild>
                <Link href="/dashboard/applications">Create application</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <ApplicationCardGrid rows={visible} query={query.toString()} />
          {hasMore ? (
            <LoadMore
              basePath="/dashboard/jobs"
              page={currentPage + 1}
              label="Show more saved jobs"
            />
          ) : null}
        </>
      )}

      {openId ? (
        <SavedJobDrawer
          userId={user.id}
          publicId={openId}
          closeHref={`/dashboard/jobs${query.toString() ? `?${query}` : ""}`}
        />
      ) : null}
    </div>
  );
}
