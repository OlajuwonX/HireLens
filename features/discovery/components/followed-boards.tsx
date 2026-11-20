import { Badge } from "@/components/ui/badge";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import type { DiscoverySource } from "@/lib/discovery/types";
import { unfollowBoardAction } from "../actions/discovery-actions";
import { sourceLabels } from "../constants";
import type { FollowedBoard } from "../server/board.repository";

export function FollowedBoards({ boards }: { boards: FollowedBoard[] }) {
  if (boards.length === 0) {
    return (
      <p className="text-meta text-text-secondary">
        Follow a company&apos;s public job board and HireLens checks it every day.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {boards.map((board) => (
        <li
          key={board.publicId}
          className="flex items-center gap-2 rounded-control border border-border bg-surface px-2.5 py-1"
        >
          <span className="text-meta font-medium text-text-primary">{board.companyName}</span>
          <span className="font-mono text-system text-text-muted">
            {sourceLabels[board.source as DiscoverySource] ?? board.source} · {board.postingCount}
          </span>
          {board.lastError ? <Badge tone="yellow">Check failed</Badge> : null}
          <DeleteConfirmButton
            action={unfollowBoardAction}
            publicId={board.publicId}
            title={`Stop following ${board.companyName}?`}
            description="Its jobs leave your discovery feed. Jobs you already saved stay saved."
            confirmLabel="Unfollow"
            toastLabel={board.companyName}
          />
        </li>
      ))}
    </ul>
  );
}
