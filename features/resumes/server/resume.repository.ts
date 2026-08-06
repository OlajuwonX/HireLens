import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumes, type NewResume } from "@/lib/db/schema";

export async function createResume(input: NewResume) {
  const [resume] = await db.insert(resumes).values(input).returning();
  return resume;
}

export async function findResumeForUser(input: { userId: string; publicId: string }) {
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.userId, input.userId), eq(resumes.publicId, input.publicId)))
    .limit(1);

  return resume ?? null;
}
