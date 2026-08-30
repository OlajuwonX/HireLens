import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AnalysisNoticeToast } from "@/features/applications/components/analysis-notice-toast";
import { ApplicationFilters } from "@/features/applications/components/application-filters";
import { SavedJobDrawer } from "@/features/applications/components/saved-job-drawer";
import { SavedJobFeed } from "@/features/applications/components/saved-job-feed";
import { APPLICATION_PAGE_SIZE } from "@/features/applications/constants";
import { applicationFiltersSchema } from "@/features/applications/schemas/application.schema";
import {
  getApplicationBoard,
  getStatusCounts,
} from "@/features/applications/server/application.service";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { readUsageDenialReason } from "@/features/usage/limit-notice";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const maxDuration = 60;

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

  const [rows, counts] = await Promise.all([
    getApplicationBoard({
      userId: user.id,
      filters,
      limit: APPLICATION_PAGE_SIZE + 1,
    }),
    getStatusCounts(user.id),
  ]);

  const query = new URLSearchParams();
  if (filters.q) query.set("q", filters.q);
  if (filters.tab !== "PENDING") query.set("tab", filters.tab);
  if (filters.sort !== "activity_desc") query.set("sort", filters.sort);

  const openId = typeof raw.open === "string" ? raw.open : null;
  const analysisFailed = raw.analysis === "failed";
  const analysisLimitReason = analysisFailed
    ? readUsageDenialReason(raw.reason)
    : null;

  const visible = rows.slice(0, APPLICATION_PAGE_SIZE);
  const nextOffset =
    rows.length > APPLICATION_PAGE_SIZE ? APPLICATION_PAGE_SIZE : null;

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
          title={
            filters.q ? "Nothing matches that search" : "No applications yet"
          }
          description={
            filters.q
              ? "Try a different search or another status tab."
              : "Create an application to save the job and analyze your resume against it."
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
        <SavedJobFeed
          key={JSON.stringify(filters)}
          initialRows={visible}
          initialNextOffset={nextOffset}
          filters={filters}
          query={query.toString()}
        />
      )}

      {analysisFailed ? (
        <AnalysisNoticeToast limitReason={analysisLimitReason} />
      ) : null}

      {openId ? (
        <SavedJobDrawer
          userId={user.id}
          publicId={openId}
          analysisFailed={analysisFailed}
          analysisLimitReason={analysisLimitReason}
          closeHref={`/dashboard/jobs${query.toString() ? `?${query}` : ""}`}
        />
      ) : null}
    </div>
  );
}
