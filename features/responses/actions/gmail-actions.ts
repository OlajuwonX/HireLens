"use server";

import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { RESPONSES_PATH } from "../constants";
import { checkGmailNow, disconnectGmail } from "../server/gmail/gmail-run.service";

export type GmailActionResult = { ok: true; message: string } | { ok: false; message: string };

export async function checkGmailNowAction(): Promise<GmailActionResult> {
  const user = await requireDatabaseUser();
  const result = await checkGmailNow(user.id);

  revalidatePath(RESPONSES_PATH);

  if (!result.ok) {
    return { ok: false, message: result.reconnect ? "Google no longer allows access. Connect Gmail again." : result.message };
  }

  return {
    ok: true,
    message: result.stored > 0 ? `Found ${result.stored} new repl${result.stored === 1 ? "y" : "ies"}.` : "No new replies.",
  };
}

export async function disconnectGmailAction(): Promise<GmailActionResult> {
  const user = await requireDatabaseUser();

  await disconnectGmail(user.id);
  revalidatePath(RESPONSES_PATH);

  return { ok: true, message: "Gmail is disconnected." };
}
