import "server-only";

import { profileCompleteness } from "../completeness";
import { toProfileFields } from "../profile-values";
import type { ProfileInput } from "../schemas/profile.schema";
import { findProfileByUser, upsertProfile } from "./profile.repository";

export async function getCandidateProfile(userId: string) {
  const profile = await findProfileByUser(userId);

  return { profile, completeness: profileCompleteness(profile) };
}

export async function saveCandidateProfile(input: {
  userId: string;
  values: ProfileInput;
}) {
  const profile = await upsertProfile({
    userId: input.userId,
    ...toProfileFields(input.values),
  });

  return profileCompleteness(profile ?? null);
}
