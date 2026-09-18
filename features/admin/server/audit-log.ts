import "server-only";

import { db } from "@/lib/db/client";
import { adminAuditLog } from "@/lib/db/schema";
import type { AdminAction, AdminTargetType } from "@/features/admin/constants";

export async function recordAdminAction(input: {
  actorId: string;
  action: AdminAction;
  targetType: AdminTargetType;
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(adminAuditLog).values({
      actorUserId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata ?? null,
    });
  } catch (error) {
    console.error("admin audit log write failed", {
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: error instanceof Error ? error.message : "unknown",
    });
  }
}
