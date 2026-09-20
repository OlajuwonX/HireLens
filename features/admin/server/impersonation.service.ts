import "server-only";

import { getAccountRecord } from "@/features/auth/server/current-account";
import { AdminActionError } from "@/features/admin/server/user-admin.service";
import { findOpenImpersonationSessionByPublicId } from "@/features/admin/server/impersonation.repository";
import type { UserRole } from "@/lib/db/schema";

export function assertCanImpersonate(input: {
  actorId: string;
  target: { id: string; role: UserRole; deletedAt: Date | null; disabledAt: Date | null };
}): void {
  if (input.target.id === input.actorId) {
    throw new AdminActionError("You cannot impersonate yourself.");
  }

  if (input.target.role === "ADMIN") {
    throw new AdminActionError("You cannot impersonate another admin.");
  }

  if (input.target.deletedAt || input.target.disabledAt) {
    throw new AdminActionError(
      "You cannot impersonate a disabled or deleted account.",
    );
  }
}

export async function resolveImpersonationClaimForUpdate(input: {
  sessionPublicId: string;
  callerRealUserId: string;
}): Promise<{
  actingAdminId: string;
  targetUserId: string;
  expiresAt: string;
} | null> {
  const row = await findOpenImpersonationSessionByPublicId(
    input.sessionPublicId,
  );

  if (!row) {
    return null;
  }

  if (row.actorUserId !== input.callerRealUserId) {
    return null;
  }

  if (row.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const actor = await getAccountRecord(row.actorUserId);

  if (!actor || actor.deletedAt || actor.role !== "ADMIN") {
    return null;
  }

  return {
    actingAdminId: row.actorUserId,
    targetUserId: row.targetUserId,
    expiresAt: row.expiresAt.toISOString(),
  };
}
