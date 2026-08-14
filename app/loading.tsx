import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      aria-busy="true"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6"
    >
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 rounded-control" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="h-1 w-40 rounded-full" />
      <span className="sr-only">Loading HireLens</span>
    </div>
  );
}
