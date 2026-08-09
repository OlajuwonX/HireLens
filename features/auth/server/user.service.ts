import "server-only";

import type { PublicUser } from "@/features/auth/types/public-user";
import type { SignUpInput } from "@/features/auth/schemas/credentials.schema";
import { shouldClearUntrustedPassword } from "@/features/auth/policies/account-linking";
import { normalizeEmail } from "./email";
import { hashPassword, verifyPassword } from "./password";
import {
  createUser,
  findUserByEmail,
  markEmailVerified,
  setUserPasswordHash,
  touchUserLogin,
  upsertOAuthAccount,
} from "./user.repository";

export async function findOrCreateUserFromPublicProfile(profile: PublicUser) {
  if (!profile.email) {
    throw new Error("Cannot create a user without an email address");
  }

  const email = normalizeEmail(profile.email);
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  return createUser({
    email,
    name: profile.name,
    image: profile.image,
    lastLoginAt: new Date(),
  });
}

export async function recordSignIn(input: {
  profile: PublicUser;
  provider: string;
  providerAccountId: string;
  emailVerified: boolean;
}) {
  if (!input.emailVerified) {
    throw new Error(
      "The identity provider did not confirm this email address is verified",
    );
  }

  const user = await findOrCreateUserFromPublicProfile(input.profile);

  await upsertOAuthAccount({
    userId: user.id,
    provider: input.provider,
    providerAccountId: input.providerAccountId,
  });

  if (!user.emailVerifiedAt) {
    await markEmailVerified({
      userId: user.id,
      clearPasswordHash: shouldClearUntrustedPassword(user),
    });
  }

  return (await touchUserLogin({ userId: user.id })) ?? user;
}

export type RegisterResult = { ok: true } | { ok: false; message: string };

export async function registerCredentialsUser(
  input: SignUpInput,
): Promise<RegisterResult> {
  const email = normalizeEmail(input.email);
  const existing = await findUserByEmail(email);
  const passwordHash = await hashPassword(input.password);

  if (existing) {
    if (existing.passwordHash) {
      return {
        ok: false,
        message: "An account with that email already exists. Sign in instead.",
      };
    }

    await setUserPasswordHash({ userId: existing.id, passwordHash });
    return { ok: true };
  }

  await createUser({
    email,
    name: input.name,
    passwordHash,
    lastLoginAt: null,
  });

  return { ok: true };
}

export async function verifyCredentials(input: {
  email: string;
  password: string;
}) {
  const user = await findUserByEmail(normalizeEmail(input.email));

  if (!user?.passwordHash || user.deletedAt) {
    return null;
  }

  const valid = await verifyPassword(input.password, user.passwordHash);

  if (!valid) {
    return null;
  }

  return (await touchUserLogin({ userId: user.id })) ?? user;
}
