import { PageTitle } from "@/components/layout/page-title";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-reading space-y-10" aria-busy="true">
      <PageTitle title="Today" />

      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-72" />
      </div>

      <ul aria-hidden className="divide-y divide-border border-y border-border">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={index} className="flex items-start gap-6 py-5">
            <Skeleton className="h-6 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-64 max-w-full" />
              <Skeleton className="h-3 w-80 max-w-full" />
            </div>
          </li>
        ))}
      </ul>

      <span className="sr-only">Loading what needs you today</span>
    </div>
  );
}
