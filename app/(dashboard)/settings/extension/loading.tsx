import { PageLoading } from "@/components/layout/page-loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageLoading title="Browser extension" label="browser extension settings">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-40 w-full" />
    </PageLoading>
  );
}
