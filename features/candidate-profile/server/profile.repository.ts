import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { candidateProfiles, type NewCandidateProfile } from "@/lib/db/schema";

export async function findProfileByUser(userId: string) {
  const [profile] = await db
    .select()
    .from(candidateProfiles)
    .where(eq(candidateProfiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

export async function upsertProfile(
  values: Omit<NewCandidateProfile, "id" | "createdAt" | "updatedAt">,
) {
  const [profile] = await db
    .insert(candidateProfiles)
    .values(values)
    .onConflictDoUpdate({
      target: candidateProfiles.userId,
      set: { ...values, updatedAt: new Date() },
    })
    .returning();

  return profile;
}

export async function listAllTargetRoles(limit = 500) {
  const rows = await db.execute<{ role: string }>(
    sql`select distinct unnest(${candidateProfiles.targetRoles}) as role from ${candidateProfiles} limit ${limit}`,
  );

  return rows.rows.map((row) => row.role).filter(Boolean);
}

export async function saveJobRegions(input: { userId: string; jobRegions: string[] }) {
  await db
    .insert(candidateProfiles)
    .values(input)
    .onConflictDoUpdate({
      target: candidateProfiles.userId,
      set: { jobRegions: input.jobRegions, updatedAt: new Date() },
    });
}
