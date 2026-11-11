import "server-only";

import { eq } from "drizzle-orm";
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
