import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";

export async function findJobForUser(input: { userId: string; publicId: string }) {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.userId, input.userId), eq(jobs.publicId, input.publicId)))
    .limit(1);

  return job ?? null;
}
