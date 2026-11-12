"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { WORKER_SETTINGS_PATH } from "../constants";
import { revokeWorkerToken } from "../server/token.repository";
import { createWorkerToken } from "../server/token.service";

export type TokenFormState = {
  status: "idle" | "error" | "saved";
  message: string;
  token?: string;
};

export async function createWorkerTokenAction(
  _state: TokenFormState,
  formData: FormData,
): Promise<TokenFormState> {
  const user = await requireDatabaseUser();
  const parsed = z.string().trim().min(1, "Name this computer").max(60).safeParse(formData.get("name") ?? "");

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Name this computer" };
  }

  const result = await createWorkerToken({ userId: user.id, name: parsed.data });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath(WORKER_SETTINGS_PATH);

  return { status: "saved", message: "Token created. Copy it now; it will not be shown again.", token: result.token };
}

export async function revokeWorkerTokenAction(formData: FormData) {
  const user = await requireDatabaseUser();
  const parsed = z.uuid().safeParse(formData.get("publicId"));

  if (parsed.success) {
    await revokeWorkerToken({ userId: user.id, publicId: parsed.data });
    revalidatePath(WORKER_SETTINGS_PATH);
  }
}
