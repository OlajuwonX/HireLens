import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  adminImpersonationSessions,
  type NewAdminImpersonationSession,
} from "@/lib/db/schema";

export async function insertImpersonationSession(
  input: NewAdminImpersonationSession,
) {
  const [row] = await db
    .insert(adminImpersonationSessions)
    .values(input)
    .returning();

  return row;
}

export async function findOpenImpersonationSessionByPublicId(
  publicId: string,
) {
  const [row] = await db
    .select()
    .from(adminImpersonationSessions)
    .where(
      and(
        eq(adminImpersonationSessions.publicId, publicId),
        isNull(adminImpersonationSessions.endedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function findOpenImpersonationSession(input: {
  actorUserId: string;
  targetUserId: string;
}) {
  const [row] = await db
    .select()
    .from(adminImpersonationSessions)
    .where(
      and(
        eq(adminImpersonationSessions.actorUserId, input.actorUserId),
        eq(adminImpersonationSessions.targetUserId, input.targetUserId),
        isNull(adminImpersonationSessions.endedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function closeImpersonationSession(publicId: string) {
  const [row] = await db
    .update(adminImpersonationSessions)
    .set({ endedAt: new Date() })
    .where(eq(adminImpersonationSessions.publicId, publicId))
    .returning();

  return row ?? null;
}
