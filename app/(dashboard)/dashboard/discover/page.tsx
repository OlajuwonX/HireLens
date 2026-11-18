import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { PROFILE_SETTINGS_PATH } from "@/features/candidate-profile/constants";
import { DiscoverTabs } from "@/features/discovery/components/discover-tabs";
import { DiscoveryFilters } from "@/features/discovery/components/discovery-filters";
import { FollowBoardForm } from "@/features/discovery/components/follow-board-form";
import { FollowedBoards } from "@/features/discovery/components/followed-boards";
import { PostingFeed } from "@/features/discovery/components/posting-feed";
import { RefreshButton } from "@/features/discovery/components/refresh-button";
import { DiscoveryRefreshProvider } from "@/features/discovery/components/refresh-context";
import { RefreshingResults } from "@/features/discovery/components/refreshing-results";
import { DISCOVERY_LIMITS } from "@/features/discovery/constants";
import { feedFiltersSchema } from "@/features/discovery/schemas/discovery.schema";
import { loadAudience } from "@/features/discovery/server/audience";
import { countSystemBoards, listFollowedBoards } from "@/features/discovery/server/board.repository";
import { feedVersion } from "@/features/discovery/feed-version";
import { getPostingFeed } from "@/features/discovery/server/feed.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover jobs",
};

export const maxDuration = 60;

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireDatabaseUser();
  const raw = await searchParams;
  const parsed = feedFiltersSchema.safeParse({ q: raw.q, arrangement: raw.arrangement });
  const filters = parsed.success ? parsed.data : {};
  const view = { q: filters.q ?? "", arrangement: filters.arrangement ?? "" };
  const audience = await loadAudience(user.id);

  const [boards, sources, feed] = await Promise.all([
    listFollowedBoards(user.id),
    countSystemBoards(),
    getPostingFeed({ audience, filters }),
  ]);

  const version = feedVersion(feed.rows);

  return (
    <DiscoveryRefreshProvider>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Discover jobs"
            description={`The latest roles from the last ${DISCOVERY_LIMITS.freshDays} days that match your target roles, from ${sources || "dozens of"} company boards and job feeds, checked every day.`}
          />
          <RefreshButton />
        </div>

        <DiscoverTabs />

        {audience.roles.length > 0 ? (
          <p className="text-meta text-text-secondary">
            Searching for: <span className="font-medium text-text-primary">{audience.roles.join(", ")}</span>.{" "}
            <Link href={PROFILE_SETTINGS_PATH} className="underline">
              Change
            </Link>
          </p>
        ) : (
          <Alert tone="warning">
            Add your target roles in your{" "}
            <Link href={PROFILE_SETTINGS_PATH} className="underline">
              career profile
            </Link>{" "}
            and HireLens will find matching jobs automatically.
          </Alert>
        )}

        <DiscoveryFilters q={view.q} arrangement={view.arrangement} />

        <RefreshingResults>
          {feed.rows.length === 0 ? (
            <EmptyState
              title="No matching jobs yet"
              description="New sources are checked daily. Select Check for new jobs to look now, or follow a specific company below."
            />
          ) : (
            <PostingFeed
              key={`${JSON.stringify(view)}:${version}`}
              initialRows={feed.rows}
              initialCursor={feed.nextCursor}
              filters={view}
              version={version}
            />
          )}
        </RefreshingResults>

        <details className="rounded-card border border-border bg-surface p-4">
          <summary className="cursor-pointer text-meta font-medium text-text-primary">
            Follow a specific company (optional)
          </summary>
          <div className="mt-4 space-y-4">
            <p className="text-meta text-text-secondary">
              HireLens already checks dozens of companies and job feeds for you. Add a company here to see
              every role it posts, not only ones matching your target roles.
            </p>
            <FollowBoardForm />
            <FollowedBoards boards={boards} />
          </div>
        </details>
      </div>
    </DiscoveryRefreshProvider>
  );
}
