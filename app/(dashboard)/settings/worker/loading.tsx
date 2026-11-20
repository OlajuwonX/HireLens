import { PageLoading } from "@/components/layout/page-loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageLoading title="Local worker" label="local worker settings">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-40 w-full" />
    </PageLoading>
  );
}
