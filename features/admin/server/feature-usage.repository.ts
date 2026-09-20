import "server-only";

import { count, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { aiUsageEvents, usageStatus } from "@/lib/db/schema";

export type ActionStatusCount = {
  action: string;
  status: (typeof usageStatus.enumValues)[number];
  value: number;
};

export async function countEventsByActionStatus(
  since: Date,
): Promise<ActionStatusCount[]> {
  return db
    .select({
      action: aiUsageEvents.action,
      status: aiUsageEvents.status,
      value: count(),
    })
    .from(aiUsageEvents)
    .where(gte(aiUsageEvents.createdAt, since))
    .groupBy(aiUsageEvents.action, aiUsageEvents.status);
}

export async function countEventsSince(since: Date): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(aiUsageEvents)
    .where(gte(aiUsageEvents.createdAt, since));

  return row?.value ?? 0;
}
