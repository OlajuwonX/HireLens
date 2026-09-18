import "server-only";

import { desc, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { adminErrorEvents, type NewAdminErrorEvent } from "@/lib/db/schema";

export async function upsertErrorEvent(input: NewAdminErrorEvent) {
  const [row] = await db
    .insert(adminErrorEvents)
    .values(input)
    .onConflictDoUpdate({
      target: adminErrorEvents.issueId,
      set: {
        sentryEventId: input.sentryEventId,
        title: input.title,
        level: input.level,
        culprit: input.culprit,
        environment: input.environment,
        eventCount: input.eventCount,
        firstSeen: input.firstSeen,
        lastSeen: input.lastSeen,
        permalink: input.permalink,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

export async function listRecentErrorEvents(limit: number) {
  return db
    .select()
    .from(adminErrorEvents)
    .orderBy(desc(adminErrorEvents.lastSeen))
    .limit(limit);
}

export async function pruneErrorEventsOlderThan(cutoff: Date) {
  await db.delete(adminErrorEvents).where(lt(adminErrorEvents.lastSeen, cutoff));
}
