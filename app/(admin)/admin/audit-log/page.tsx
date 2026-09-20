import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadMore } from "@/components/ui/load-more";
import { AuditLogFilters } from "@/features/admin/components/audit-log-filters";
import { AuditLogTable } from "@/features/admin/components/audit-log-table";
import { auditLogSearchSchema } from "@/features/admin/schemas/audit-log-search.schema";
import { requireAdminUser } from "@/features/admin/server/require-admin";
import { listAuditLogEntries } from "@/features/admin/server/audit-log.repository";
import type { AdminAction } from "@/features/admin/constants";

export const metadata: Metadata = {
  title: "Audit log",
};

const PAGE_SIZE = 25;
const AUDIT_LOG_PATH = "/admin/audit-log";

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminUser();

  const raw = await searchParams;
  const parsed = auditLogSearchSchema.safeParse({
    actor: raw.actor,
    action: raw.action,
  });
  const filters = parsed.success ? parsed.data : {};

  const page = Number.parseInt(
    typeof raw.page === "string" ? raw.page : "1",
    10,
  );
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;

  const rows = await listAuditLogEntries({
    actorEmail: filters.actor,
    action: filters.action as AdminAction | undefined,
    limit: PAGE_SIZE + 1,
    offset: (currentPage - 1) * PAGE_SIZE,
  });

  const visible = rows.slice(0, PAGE_SIZE);
  const hasMore = rows.length > PAGE_SIZE;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Every sensitive admin action, newest first."
      />

      <AuditLogFilters />

      {visible.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Sensitive admin actions show up here as they happen."
        />
      ) : (
        <>
          <AuditLogTable rows={visible} />
          {hasMore ? (
            <LoadMore basePath={AUDIT_LOG_PATH} page={currentPage + 1} />
          ) : null}
        </>
      )}
    </div>
  );
}
