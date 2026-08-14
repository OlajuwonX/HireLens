import { BackButton } from "@/components/layout/back-button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <BackButton href="/dashboard/documents" label="AI Documents" />

      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div aria-hidden className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="size-10" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-card border border-border bg-surface p-4 sm:p-5">
          <div className="space-y-3" aria-hidden>
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>

        <div className="space-y-3 rounded-card border border-border bg-surface p-4">
          <p className="text-section-title font-semibold text-text-primary">
            Source
          </p>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-3.5 w-full" aria-hidden />
          ))}
        </div>
      </div>

      <span className="sr-only">Loading document</span>
    </div>
  );
}
