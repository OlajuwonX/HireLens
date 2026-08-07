import "server-only";

import { requireCurrentUser } from "./require-user";
import { findOrCreateUserFromPublicProfile } from "./user.service";

export async function requireDatabaseUser() {
  const currentUser = await requireCurrentUser();

  return findOrCreateUserFromPublicProfile(currentUser.user);
}
