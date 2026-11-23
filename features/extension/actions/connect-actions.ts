"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { WORKER_SETTINGS_PATH } from "@/features/worker/constants";
import { connectExtension, type ConnectResult } from "../server/connect.service";

export async function connectExtensionAction(): Promise<ConnectResult> {
  const user = await requireDatabaseUser();
  const result = await connectExtension(user.id);

  revalidatePath(WORKER_SETTINGS_PATH);

  return result;
}
