import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userEvidenceCorrections } from "@/lib/db/schema";

export async function upsertEvidenceCorrection(input: {
  userId: string;
  requirementMatchId: string;
  markedIncorrect: boolean;
  evidence: string | null;
  notes: string | null;
}) {
  const [existing] = await db
    .select()
    .from(userEvidenceCorrections)
    .where(
      and(
        eq(userEvidenceCorrections.userId, input.userId),
        eq(
          userEvidenceCorrections.requirementMatchId,
          input.requirementMatchId,
        ),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(userEvidenceCorrections)
      .set({
        markedIncorrect: input.markedIncorrect,
        evidence: input.evidence,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .where(eq(userEvidenceCorrections.id, existing.id))
      .returning();

    return updated ?? null;
  }

  const [created] = await db
    .insert(userEvidenceCorrections)
    .values(input)
    .returning();

  return created ?? null;
}

export async function deleteEvidenceCorrection(input: {
  userId: string;
  requirementMatchId: string;
}) {
  await db
    .delete(userEvidenceCorrections)
    .where(
      and(
        eq(userEvidenceCorrections.userId, input.userId),
        eq(
          userEvidenceCorrections.requirementMatchId,
          input.requirementMatchId,
        ),
      ),
    );
}
