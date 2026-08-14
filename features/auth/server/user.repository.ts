import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accounts, users, type NewUser } from "@/lib/db/schema";

export async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
}

export async function createUser(input: NewUser) {
  const [user] = await db.insert(users).values(input).returning();
  return user;
}

export async function setUserPasswordHash(input: {
  userId: string;
  passwordHash: string;
}) {
  const [user] = await db
    .update(users)
    .set({ passwordHash: input.passwordHash, updatedAt: new Date() })
    .where(eq(users.id, input.userId))
    .returning();

  return user ?? null;
}

export async function markEmailVerified(input: {
  userId: string;
  clearPasswordHash?: boolean;
}) {
  const [user] = await db
    .update(users)
    .set({
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
      ...(input.clearPasswordHash ? { passwordHash: null } : {}),
    })
    .where(eq(users.id, input.userId))
    .returning();

  return user ?? null;
}

export async function touchUserLogin(input: { userId: string }) {
  const [user] = await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, input.userId))
    .returning();

  return user ?? null;
}

export async function upsertOAuthAccount(input: {
  userId: string;
  provider: string;
  providerAccountId: string;
}) {
  const [existing] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.provider, input.provider),
        eq(accounts.providerAccountId, input.providerAccountId),
      ),
    )
    .limit(1);

  if (existing) {
    return existing;
  }

  const [account] = await db.insert(accounts).values(input).returning();

  return account;
}

export async function completeUserOnboarding(input: { userId: string }) {
  const [user] = await db
    .update(users)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(eq(users.id, input.userId))
    .returning();

  return user ?? null;
}

export async function findUserById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ?? null;
}
