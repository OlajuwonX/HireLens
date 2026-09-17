import { Badge } from "@/components/ui/badge";
import {
  disableUserAction,
  enableUserAction,
  promoteToAdminAction,
  revokeAdminAction,
} from "@/features/admin/actions/user-admin-actions";
import type { AdminUserListRow } from "@/features/admin/server/user-admin.repository";
import { AdminConfirmActionButton } from "./admin-confirm-action-button";
import { AdminInlineActionButton } from "./admin-inline-action-button";

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

export function UserTable({ rows }: { rows: AdminUserListRow[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
      {rows.map((row) => (
        <li
          key={row.publicId}
          className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-meta font-medium text-text-primary">
              {row.name ?? row.email}
            </p>
            <p className="truncate font-mono text-system text-text-muted">
              {row.email}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge tone={row.emailVerifiedAt ? "green" : "yellow"}>
              {row.emailVerifiedAt ? "Verified" : "Unverified"}
            </Badge>
            <Badge tone={row.role === "ADMIN" ? "blue" : "neutral"}>
              {row.role === "ADMIN" ? "Admin" : "User"}
            </Badge>
            {row.disabledAt ? <Badge tone="red">Disabled</Badge> : null}
            <span className="font-mono text-system text-text-muted">
              Joined {shortDate(row.createdAt)}
            </span>
            <span className="font-mono text-system text-text-muted">
              Last login {shortDate(row.lastLoginAt)}
            </span>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
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
              <AdminInlineActionButton
                action={promoteToAdminAction}
                publicId={row.publicId}
                label="Promote to admin"
                pendingLabel="Promoting..."
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
          </div>
        </li>
      ))}
    </ul>
  );
}
