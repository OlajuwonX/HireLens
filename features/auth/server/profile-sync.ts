import "server-only";

import type { CurrentUser } from "./current-user";
import { findOrCreateUserFromPublicProfile } from "./user.service";

export type SyncedUserProfile = CurrentUser & {
  persistence: "database";
  userId: string;
};

export async function syncUserProfile(
  currentUser: CurrentUser,
): Promise<SyncedUserProfile> {
  const user = await findOrCreateUserFromPublicProfile(currentUser.user);

  return {
    ...currentUser,
    userId: user.id,
    persistence: "database",
    account: {
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      onboardingCompleted: user.onboardingCompleted,
    },
  };
}
