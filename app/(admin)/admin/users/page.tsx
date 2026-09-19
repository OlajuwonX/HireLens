import type { Metadata } from "next";
import { MetricCard } from "@/components/data-display/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadMore } from "@/components/ui/load-more";
import { requireAdminUser } from "@/features/admin/server/require-admin";
import { UserSearchInput } from "@/features/admin/components/user-search-input";
import { UserTable } from "@/features/admin/components/user-table";
import { userSearchSchema } from "@/features/admin/schemas/user-search.schema";
import {
  countUserMetrics,
  listUsers,
} from "@/features/admin/server/user-admin.repository";

export const metadata: Metadata = {
  title: "Users",
};

const PAGE_SIZE = 25;
const USERS_PATH = "/admin/users";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminUser();

  const raw = await searchParams;
  const parsed = userSearchSchema.safeParse({
    q: raw.q,
    sort: raw.sort,
    dir: raw.dir,
  });
  const filters = parsed.success ? parsed.data : {};
  const sort = filters.sort ?? "createdAt";
  const dir = filters.dir ?? "desc";

  const page = Number.parseInt(
    typeof raw.page === "string" ? raw.page : "1",
    10,
  );
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

  const [rows, metrics] = await Promise.all([
    listUsers({
      q: filters.q,
      sort,
      dir,
      limit: PAGE_SIZE + 1,
      offset: (currentPage - 1) * PAGE_SIZE,
    }),
    countUserMetrics(),
  ]);

  const visible = rows.slice(0, PAGE_SIZE);
  const hasMore = rows.length > PAGE_SIZE;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Everyone with a HireLens account."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Verified" value={metrics.verified} />
        <MetricCard label="Unverified" value={metrics.unverified} />
        <MetricCard label="Disabled" value={metrics.disabled} />
      </div>

      <UserSearchInput />

      {visible.length === 0 ? (
        <EmptyState
          title="No users match"
          description="Try a different search."
        />
      ) : (
        <>
          <UserTable rows={visible} q={filters.q} sort={sort} dir={dir} />
          {hasMore ? (
            <LoadMore basePath={USERS_PATH} page={currentPage + 1} />
          ) : null}
        </>
      )}
    </div>
  );
}
