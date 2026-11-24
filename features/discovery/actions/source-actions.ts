"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { DISCOVERY_PATH } from "../constants";
import { boardRefSchema, jobRegionSchema } from "../schemas/discovery.schema";
import { followSuggestedBoard, setJobRegion, type SuggestionResult } from "../server/suggestion.service";

export async function followSuggestedBoardAction(publicId: string): Promise<SuggestionResult> {
  const user = await requireDatabaseUser();
  const parsed = boardRefSchema.safeParse({ publicId });

  if (!parsed.success) {
    return { ok: false, message: "That company could not be found." };
  }

  const result = await followSuggestedBoard({ userId: user.id, publicId: parsed.data.publicId });

  if (result.ok) {
    revalidatePath(DISCOVERY_PATH);
  }

  return result;
}

export async function setJobRegionAction(input: unknown) {
  const user = await requireDatabaseUser();
  const parsed = jobRegionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const };
  }

  const regions = await setJobRegion({ userId: user.id, ...parsed.data });

  revalidatePath(DISCOVERY_PATH);
  revalidatePath(`${DISCOVERY_PATH}/matches`);

  return { ok: true as const, regions };
}
