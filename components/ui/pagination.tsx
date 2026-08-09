import { Button } from "./button";

export function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Pagination">
      <Button variant="outline" onClick={onPrevious} disabled={!onPrevious || page <= 1}>
        Previous
      </Button>
      <span className="text-meta text-text-secondary">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" onClick={onNext} disabled={!onNext || page >= totalPages}>
        Next
      </Button>
    </nav>
  );
}
