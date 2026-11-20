import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { resumeReviews } from "@/lib/db/schema";

export async function findReviewByHash(input: {
  userId: string;
  inputHash: string;
}) {
  const [row] = await db
    .select()
    .from(resumeReviews)
    .where(
      and(
        eq(resumeReviews.userId, input.userId),
        eq(resumeReviews.inputHash, input.inputHash),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function insertReview(values: typeof resumeReviews.$inferInsert) {
  const [row] = await db
    .insert(resumeReviews)
    .values(values)
    .onConflictDoNothing()
    .returning();

  return row ?? findReviewByHash(values);
}
