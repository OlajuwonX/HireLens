import { PageLoading } from "@/components/layout/page-loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageLoading title="Your matches" label="your matches">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-56 w-full" />
        ))}
      </div>
    </PageLoading>
  );
}
