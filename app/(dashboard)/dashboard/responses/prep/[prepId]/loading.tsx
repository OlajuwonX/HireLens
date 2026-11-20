import { PageLoading } from "@/components/layout/page-loading";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageLoading title="Interview preparation" label="interview preparation">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full" />
      ))}
    </PageLoading>
  );
}
