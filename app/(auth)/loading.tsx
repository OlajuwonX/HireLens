import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="space-y-4" aria-hidden>
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-11 w-full" />
      </div>

      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="mx-auto h-3.5 w-48" />
      </div>

      <span className="sr-only">Loading</span>
    </div>
  );
}
