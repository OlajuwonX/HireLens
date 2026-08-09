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
  const [correction] = await db
    .insert(userEvidenceCorrections)
    .values(input)
    .onConflictDoUpdate({
      target: [
        userEvidenceCorrections.userId,
        userEvidenceCorrections.requirementMatchId,
      ],
      set: {
        markedIncorrect: input.markedIncorrect,
        evidence: input.evidence,
        notes: input.notes,
        updatedAt: new Date(),
      },
    })
    .returning();

  return correction ?? null;
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
