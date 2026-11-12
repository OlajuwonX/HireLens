import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { profileCompleteness } from "@/features/candidate-profile/completeness";
import { PROFILE_SETTINGS_PATH } from "@/features/candidate-profile/constants";
import { findProfileByUser } from "@/features/candidate-profile/server/profile.repository";
import { DiscoverTabs } from "@/features/discovery/components/discover-tabs";
import { MatchCard } from "@/features/matching/components/match-card";
import { MatchRunner } from "@/features/matching/components/match-runner";
import { ScreenedOutList } from "@/features/matching/components/screened-out-list";
import { toMatchView } from "@/features/matching/match-view";
import { listScreenedOut, listShortlist } from "@/features/matching/server/shortlist.repository";
import { SHORTLIST_SIZE } from "@/lib/matching/rank";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your matches",
};

export const maxDuration = 60;

export default async function MatchesPage() {
  const user = await requireDatabaseUser();
  const [shortlist, screenedOut, profile] = await Promise.all([
    listShortlist(user.id),
    listScreenedOut(user.id),
    findProfileByUser(user.id),
  ]);
  const completeness = profileCompleteness(profile);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Your matches"
          description={`The best fits from the boards you follow, up to ${SHORTLIST_SIZE} at a time. Scores are HireLens estimates.`}
        />
        <MatchRunner />
      </div>

      <DiscoverTabs />

      {completeness.readyToApply ? null : (
        <Alert tone="warning">
          Matching works best with a complete{" "}
          <Link href={PROFILE_SETTINGS_PATH} className="underline">
            career profile
          </Link>
          . Missing: {completeness.missingRequired.map((item) => item.label).join(", ")}.
        </Alert>
      )}

      {shortlist.length === 0 ? (
        <EmptyState
          title="No matches yet"
          description="Follow a few company boards, then select Find matches to score the newest roles against your resume."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {shortlist.map((row) => (
            <MatchCard key={row.publicId} match={toMatchView(row)} />
          ))}
        </ul>
      )}

      <ScreenedOutList matches={screenedOut.map(toMatchView)} />
    </div>
  );
}
