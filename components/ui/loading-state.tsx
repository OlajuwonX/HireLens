import { Skeleton } from "./skeleton";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <section aria-busy="true" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </section>
  );
}
