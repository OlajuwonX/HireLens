import { POSITIVE_KINDS, type ResponseKind } from "@/lib/responses/classify";

type Row = { status: string; kind: string };

export function groupResponses<T extends Row>(rows: T[]) {
  const priority: T[] = [];
  const review: T[] = [];
  const other: T[] = [];

  for (const row of rows) {
    if (row.status === "NEEDS_REVIEW") {
      review.push(row);
    } else if (POSITIVE_KINDS.includes(row.kind as ResponseKind)) {
      priority.push(row);
    } else {
      other.push(row);
    }
  }

  return { priority, review, other };
}
