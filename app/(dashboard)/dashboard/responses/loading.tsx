import { PageLoading } from "@/components/layout/page-loading";
import { Skeleton } from "@/components/ui/skeleton";
import { ListRowSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageLoading title="Replies" label="replies">
      <Skeleton className="h-12 w-full" />
      <ListRowSkeleton rows={4} />
    </PageLoading>
  );
}
