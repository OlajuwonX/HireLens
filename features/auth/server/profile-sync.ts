import "server-only";

import type { CurrentUser } from "./current-user";

export type SyncedUserProfile = CurrentUser & {
  persistence: "session-only";
};

export async function syncUserProfile(
  currentUser: CurrentUser,
): Promise<SyncedUserProfile> {
  return {
    ...currentUser,
    persistence: "session-only",
  };
}
