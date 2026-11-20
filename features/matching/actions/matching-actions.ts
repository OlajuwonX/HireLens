"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { MATCHES_PATH } from "../constants";
import { dismissMatch } from "../server/match.repository";
import { runMatching, type MatchingOutcome } from "../server/matching.service";

export async function runMatchingAction(): Promise<MatchingOutcome> {
  const user = await requireDatabaseUser();
  const outcome = await runMatching({ userId: user.id });

  revalidatePath(MATCHES_PATH);

  return outcome;
}

export async function dismissMatchAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const parsed = z.object({ publicId: z.uuid() }).safeParse({
    publicId: formData.get("publicId"),
  });

  if (parsed.success) {
    await dismissMatch({ userId: user.id, publicId: parsed.data.publicId });
    revalidatePath(MATCHES_PATH);
  }
}
