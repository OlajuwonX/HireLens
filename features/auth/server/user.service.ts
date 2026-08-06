import "server-only";

import { findUserByEmail, createUser } from "./user.repository";
import type { PublicUser } from "@/features/auth/types/public-user";

export async function findOrCreateUserFromPublicProfile(profile: PublicUser) {
  if (!profile.email) {
    throw new Error("Cannot create a user without an email address");
  }

  const existingUser = await findUserByEmail(profile.email);

  if (existingUser) {
    return existingUser;
  }

  return createUser({
    email: profile.email,
    name: profile.name,
    image: profile.image,
    lastLoginAt: new Date(),
  });
}
