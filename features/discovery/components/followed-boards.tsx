import { plural } from "@/lib/format/plural";
import { Badge } from "@/components/ui/badge";

import type { DiscoverySource } from "@/lib/discovery/types";
import { UnfollowButton } from "./unfollow-button";
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
          className="flex max-w-full min-w-0 items-center gap-2 rounded-control border border-border bg-surface py-1 pl-2.5 pr-1"
        >
          <span className="min-w-0 truncate text-meta font-medium text-text-primary">{board.companyName}</span>
          <span className="shrink-0 whitespace-nowrap font-mono text-system text-text-muted">
            {sourceLabels[board.source as DiscoverySource] ?? board.source} · {plural(board.postingCount, "role", "roles")}
          </span>
          {board.lastError ? <Badge tone="yellow">Check failed</Badge> : null}
          <UnfollowButton publicId={board.publicId} companyName={board.companyName} />
        </li>
      ))}
    </ul>
  );
}
