"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { MATCHES_PATH } from "../constants";
import { dismissMatch, restoreMatch } from "../server/match.repository";
import { runMatching, type MatchingOutcome } from "../server/matching.service";

export async function runMatchingAction(): Promise<MatchingOutcome> {
  const user = await requireDatabaseUser();
  const outcome = await runMatching({ userId: user.id });

  revalidatePath(MATCHES_PATH);

  return outcome;
}

async function withMatch(publicId: unknown, run: (input: { userId: string; publicId: string }) => Promise<unknown>) {
  const user = await requireDatabaseUser();
  const parsed = z.uuid().safeParse(publicId);

  if (!parsed.success) {
    return false;
  }

  await run({ userId: user.id, publicId: parsed.data });
  revalidatePath(MATCHES_PATH);

  return true;
}

export async function hideMatchAction(publicId: string) {
  return withMatch(publicId, dismissMatch);
}

export async function restoreMatchAction(publicId: string) {
  return withMatch(publicId, restoreMatch);
}
