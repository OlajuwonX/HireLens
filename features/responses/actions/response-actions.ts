"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { RESPONSES_PATH } from "../constants";
import { reviewEventSchema } from "../schemas/email.schema";
import { confirmResponse, dismissResponse, regeneratePrep, type ReviewResult } from "../server/event-review.service";
import type { PrepOutcome } from "../server/prep.service";

export async function confirmResponseAction(input: unknown): Promise<ReviewResult> {
  const user = await requireDatabaseUser();
  const parsed = reviewEventSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose what this message is." };
  }

  const result = await confirmResponse({ userId: user.id, ...parsed.data });
  revalidatePath(RESPONSES_PATH);

  return result;
}

export async function dismissResponseAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const parsed = z.uuid().safeParse(formData.get("publicId"));

  if (parsed.success) {
    await dismissResponse({ userId: user.id, publicId: parsed.data });
    revalidatePath(RESPONSES_PATH);
  }
}

export async function generatePrepAction(publicId: string): Promise<PrepOutcome> {
  const user = await requireDatabaseUser();
  const parsed = z.uuid().safeParse(publicId);

  if (!parsed.success) {
    return { ok: false, message: "That preparation could not be found." };
  }

  const result = await regeneratePrep({ userId: user.id, publicId: parsed.data });
  revalidatePath(RESPONSES_PATH);

  return result;
}
