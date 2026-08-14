import { Skeleton } from "./skeleton";

export function FiltersRowSkeleton({ trailing = 2 }: { trailing?: number }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Skeleton className="h-10 min-w-0 flex-1" />
      <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0">
        {Array.from({ length: trailing }).map((_, index) => (
          <Skeleton key={index} className="h-10 sm:w-44" />
        ))}
      </div>
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        <Skeleton className="size-9 shrink-0 rounded-full sm:size-11" />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-1">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-auto h-5 w-20 rounded-full" />
    </div>
  );
}

export function DocumentCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2 rounded-card border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-3 w-4/5" />
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

export function ResumeCardSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="size-9" />
        </div>
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="space-y-2 rounded-card border border-border bg-surface p-4">
      <Skeleton className="h-2.5 w-16" />
      <Skeleton className="h-7 w-12" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function ListRowSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-card border border-border bg-surface">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 p-4"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-24 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function FormFieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className={tall ? "h-40 w-full" : "h-10 w-full"} />
    </div>
  );
}
