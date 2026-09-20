import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  disableUserAction,
  enableUserAction,
  promoteToAdminAction,
  revokeAdminAction,
} from "@/features/admin/actions/user-admin-actions";
import type {
  UserSearchFilters,
  UserSortKey,
} from "@/features/admin/schemas/user-search.schema";
import type { AdminUserListRow } from "@/features/admin/server/user-admin.repository";
import { AdminConfirmActionButton } from "./admin-confirm-action-button";
import { AdminInlineActionButton } from "./admin-inline-action-button";
import { ImpersonateActionButton } from "./impersonate-action-button";

const DEFAULT_DIR: Record<UserSortKey, "asc" | "desc"> = {
  name: "asc",
  createdAt: "desc",
  lastLoginAt: "desc",
};

const COLUMN_LABELS: Record<UserSortKey, string> = {
  name: "User",
  createdAt: "Joined",
  lastLoginAt: "Last login",
};

function shortDate(value: Date | null) {
  if (!value) {
    return "Never";
  }

  return value.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SortHeader({
  sortKey,
  currentSort,
  currentDir,
  q,
}: {
  sortKey: UserSortKey;
  currentSort: UserSortKey;
  currentDir: "asc" | "desc";
  q?: string;
}) {
  const active = currentSort === sortKey;
  const nextDir = active
    ? currentDir === "asc"
      ? "desc"
      : "asc"
    : DEFAULT_DIR[sortKey];

  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  params.set("sort", sortKey);
  params.set("dir", nextDir);

  const Icon = active ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th scope="col" className="px-4 py-3 text-left">
      <Link
        href={`/admin/users?${params.toString()}`}
        className="inline-flex items-center gap-1 font-mono text-[0.6875rem] font-medium uppercase text-text-muted transition-colors hover:text-text-primary sm:text-system"
      >
        {COLUMN_LABELS[sortKey]}
        <Icon
          aria-hidden="true"
          className={active ? "size-3 text-text-primary" : "size-3"}
        />
      </Link>
    </th>
  );
}

function StaticHeader({ label }: { label: string }) {
  return (
    <th
      scope="col"
      className="px-4 py-3 text-left font-mono text-[0.6875rem] font-medium uppercase text-text-muted sm:text-system"
    >
      {label}
    </th>
  );
}

export function UserTable({
  rows,
  q,
  sort,
  dir,
  currentAdminEmail,
}: {
  rows: AdminUserListRow[];
  q?: UserSearchFilters["q"];
  sort: UserSortKey;
  dir: "asc" | "desc";
  currentAdminEmail: string;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <SortHeader sortKey="name" currentSort={sort} currentDir={dir} q={q} />
              <StaticHeader label="Verified" />
              <StaticHeader label="Role" />
              <StaticHeader label="Status" />
              <SortHeader
                sortKey="createdAt"
                currentSort={sort}
                currentDir={dir}
                q={q}
              />
              <SortHeader
                sortKey="lastLoginAt"
                currentSort={sort}
                currentDir={dir}
                q={q}
              />
              <StaticHeader label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr
                key={row.publicId}
                className="transition-colors hover:bg-surface-secondary"
              >
                <td className="max-w-64 px-4 py-3">
                  <p className="truncate text-meta font-medium text-text-primary">
                    {row.name ?? row.email}
                  </p>
                  <p className="truncate font-mono text-system text-text-muted">
                    {row.email}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={row.emailVerifiedAt ? "green" : "yellow"}>
                    {row.emailVerifiedAt ? "Verified" : "Unverified"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={row.role === "ADMIN" ? "blue" : "neutral"}>
                    {row.role === "ADMIN" ? "Admin" : "User"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={row.disabledAt ? "red" : "green"}>
                    {row.disabledAt ? "Disabled" : "Active"}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-system text-text-muted">
                  {shortDate(row.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-system text-text-muted">
                  {shortDate(row.lastLoginAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {row.role === "ADMIN" ? (
                      <AdminConfirmActionButton
                        action={revokeAdminAction}
                        publicId={row.publicId}
                        label="Revoke admin"
                        title={`Revoke admin for ${row.name ?? row.email}?`}
                        description="They immediately lose access to Administration."
                        confirmLabel="Revoke admin"
                        successMessage="Admin access revoked."
                      />
                    ) : (
                      <AdminConfirmActionButton
                        action={promoteToAdminAction}
                        publicId={row.publicId}
                        label="Promote to admin"
                        title={`Promote ${row.name ?? row.email} to admin?`}
                        description="They get full Administration access — user management, audit log, everything in this panel. This isn't reversible by them, only by another admin."
                        confirmLabel="Promote to admin"
                        successMessage="Promoted to admin."
                      />
                    )}

                    {row.disabledAt ? (
                      <AdminInlineActionButton
                        action={enableUserAction}
                        publicId={row.publicId}
                        label="Enable"
                        pendingLabel="Enabling..."
                        successMessage="Account re-enabled."
                      />
                    ) : (
                      <AdminConfirmActionButton
                        action={disableUserAction}
                        publicId={row.publicId}
                        label="Disable"
                        title={`Disable ${row.name ?? row.email}?`}
                        description="They're signed out and blocked from signing back in until re-enabled."
                        confirmLabel="Disable account"
                        successMessage="Account disabled."
                      />
                    )}

                    {row.role !== "ADMIN" && row.email !== currentAdminEmail ? (
                      <ImpersonateActionButton
                        publicId={row.publicId}
                        targetLabel={row.name ?? row.email}
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
