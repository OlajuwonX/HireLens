import "server-only";

import { findProfileByUser } from "@/features/candidate-profile/server/profile.repository";
import { buildRoleMatcher } from "@/lib/discovery/role-match";
import type { Audience } from "./visibility";

export async function loadAudience(userId: string): Promise<Audience & { roles: string[] }> {
  const profile = await findProfileByUser(userId);
  const roles = profile?.targetRoles ?? [];

  return { userId, roles, matcher: buildRoleMatcher(roles) };
}
