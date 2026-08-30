"use server";

import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { completeUserOnboarding } from "@/features/auth/server/user.repository";

export async function completeOnboardingAction() {
  const user = await requireDatabaseUser();

  await completeUserOnboarding({ userId: user.id });
}
