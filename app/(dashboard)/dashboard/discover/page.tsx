import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { DiscoverTabs } from "@/features/discovery/components/discover-tabs";
import { DiscoveryFilters } from "@/features/discovery/components/discovery-filters";
import { FollowBoardForm } from "@/features/discovery/components/follow-board-form";
import { FollowedBoards } from "@/features/discovery/components/followed-boards";
import { PostingFeed } from "@/features/discovery/components/posting-feed";
import { feedFiltersSchema } from "@/features/discovery/schemas/discovery.schema";
import { listFollowedBoards } from "@/features/discovery/server/board.repository";
import { getPostingFeed } from "@/features/discovery/server/feed.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover jobs",
};

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

  const [boards, feed] = await Promise.all([
    listFollowedBoards(user.id),
    getPostingFeed({ userId: user.id, filters }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover jobs"
        description="Open roles from the company job boards you follow, checked every day."
      />

      <DiscoverTabs />

      <Card>
        <CardHeader>
          <CardTitle>Boards you follow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FollowBoardForm />
          <FollowedBoards boards={boards} />
        </CardContent>
      </Card>

      <DiscoveryFilters q={view.q} arrangement={view.arrangement} />

      {feed.rows.length === 0 ? (
        <EmptyState
          title={boards.length === 0 ? "No boards yet" : "No matching jobs"}
          description={
            boards.length === 0
              ? "Follow a company's Greenhouse, Lever or Ashby board to see its open roles here."
              : "Try a different search or arrangement."
          }
        />
      ) : (
        <PostingFeed
          key={JSON.stringify(view)}
          initialRows={feed.rows}
          initialCursor={feed.nextCursor}
          filters={view}
        />
      )}
    </div>
  );
}
