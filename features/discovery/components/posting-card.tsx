import { memo } from "react";
import { workArrangementLabels } from "@/features/jobs/constants";
import type { WorkArrangement } from "@/lib/db/schema";
import type { PostingListRow } from "../server/feed.repository";

function postedLabel(date: Date | null) {
  return date
    ? date.toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : "Recently";
}

function salaryLabel(row: PostingListRow) {
  if (!row.salaryMin) {
    return null;
  }

  const format = (value: number) => `${Math.round(value / 1000)}k`;
  const range = row.salaryMax ? `${format(row.salaryMin)}–${format(row.salaryMax)}` : format(row.salaryMin);

  return [row.currency, range].filter(Boolean).join(" ");
}

export const PostingCard = memo(function PostingCard({
  row,
  onOpen,
}: {
  row: PostingListRow;
  onOpen: (publicId: string) => void;
}) {
  const details = [
    row.location,
    workArrangementLabels[row.workArrangement as WorkArrangement],
    salaryLabel(row),
  ].filter(Boolean);

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(row.publicId)}
        className="flex h-full w-full flex-col gap-2 rounded-card border border-border bg-surface p-3 text-left transition-colors hover:border-border-strong sm:p-4"
      >
        <span className="truncate text-meta font-semibold text-text-primary">{row.title}</span>
        <span className="truncate text-label text-text-secondary">{row.company}</span>
        <span className="line-clamp-2 text-label text-text-muted">{details.join(" · ")}</span>
        <span className="mt-auto font-mono text-system text-text-muted">
          Posted {postedLabel(row.postedAt)}
        </span>
      </button>
    </li>
  );
});
