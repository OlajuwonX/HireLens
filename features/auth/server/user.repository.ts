import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, type NewUser } from "@/lib/db/schema";

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function createUser(input: NewUser) {
  const [user] = await db.insert(users).values(input).returning();
  return user;
}
