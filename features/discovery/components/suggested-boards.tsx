import { plural } from "@/lib/format/plural";
import { regionDetails, readRegions } from "@/lib/discovery/regions";
import type { CatalogSource } from "@/lib/discovery/types";
import { sourceLabels } from "../constants";
import type { SuggestedBoard } from "../server/suggestion.repository";
import { FollowSuggestionButton } from "./follow-suggestion-button";

export function SuggestedBoards({ boards }: { boards: SuggestedBoard[] }) {
  if (boards.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="suggested-boards" className="space-y-3">
      <div>
        <h2 id="suggested-boards" className="text-meta font-medium text-text-primary">
          Companies hiring for your roles
        </h2>
        <p className="text-meta text-text-secondary">
          Follow one to see every role it posts, not only the ones matching your target roles.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((board) => {
          const region = readRegions(board.region ? [board.region] : [])[0];

          return (
            <li
              key={board.publicId}
              className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-meta font-medium text-text-primary">{board.companyName}</p>
                <p className="font-mono text-system text-text-muted">
                  {plural(board.openRoles, "matching role", "matching roles")} · {sourceLabels[board.source as CatalogSource] ?? board.source}
                  {region ? ` · ${regionDetails[region].label}` : ""}
                </p>
              </div>
              <FollowSuggestionButton publicId={board.publicId} companyName={board.companyName} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
