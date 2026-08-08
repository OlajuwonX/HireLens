import "server-only";

import type { PublicUser } from "@/features/auth/types/public-user";
import {
  createUser,
  findUserByEmail,
  touchUserLogin,
  upsertOAuthAccount,
} from "./user.repository";

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

export async function recordSignIn(input: {
  profile: PublicUser;
  provider: string;
  providerAccountId: string;
}) {
  const user = await findOrCreateUserFromPublicProfile(input.profile);

  await upsertOAuthAccount({
    userId: user.id,
    provider: input.provider,
    providerAccountId: input.providerAccountId,
  });

  return (await touchUserLogin({ userId: user.id })) ?? user;
}
