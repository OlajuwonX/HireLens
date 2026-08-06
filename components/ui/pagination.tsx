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
      <Button variant="secondary" onClick={onPrevious} disabled={!onPrevious || page <= 1}>
        Previous
      </Button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <Button variant="secondary" onClick={onNext} disabled={!onNext || page >= totalPages}>
        Next
      </Button>
    </nav>
  );
}
