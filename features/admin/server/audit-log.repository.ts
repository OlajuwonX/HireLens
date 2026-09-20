import "server-only";

import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { adminAuditLog, users } from "@/lib/db/schema";
import type { AdminAction } from "@/features/admin/constants";

const listRowShape = {
  publicId: adminAuditLog.publicId,
  action: adminAuditLog.action,
  targetType: adminAuditLog.targetType,
  targetId: adminAuditLog.targetId,
  metadata: adminAuditLog.metadata,
  createdAt: adminAuditLog.createdAt,
  actorEmail: users.email,
};

export type AuditLogListRow = {
  publicId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: unknown;
  createdAt: Date;
  actorEmail: string;
};

export async function listAuditLogEntries(input: {
  actorEmail?: string;
  action?: AdminAction;
  limit: number;
  offset: number;
}): Promise<AuditLogListRow[]> {
  const conditions = [];

  if (input.actorEmail) {
    conditions.push(ilike(users.email, `%${input.actorEmail}%`));
  }

  if (input.action) {
    conditions.push(eq(adminAuditLog.action, input.action));
  }

  return db
    .select(listRowShape)
    .from(adminAuditLog)
    .innerJoin(users, eq(users.id, adminAuditLog.actorUserId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(input.limit)
    .offset(input.offset);
}
