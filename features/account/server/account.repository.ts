import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const accountShape = {
  id: users.id,
  name: users.name,
  email: users.email,
  disabledAt: users.disabledAt,
  deletedAt: users.deletedAt,
  purgeAfter: users.purgeAfter,
};

export type AccountRow = {
  id: string;
  name: string | null;
  email: string;
  disabledAt: Date | null;
  deletedAt: Date | null;
  purgeAfter: Date | null;
};

export async function setAccountDisabled(input: {
  userId: string;
  disabledAt: Date | null;
}): Promise<AccountRow | null> {
  const [row] = await db
    .update(users)
    .set({ disabledAt: input.disabledAt, updatedAt: new Date() })
    .where(and(eq(users.id, input.userId), isNull(users.deletedAt)))
    .returning(accountShape);

  return row ?? null;
}

export async function setAccountDeletion(input: {
  userId: string;
  deletedAt: Date | null;
  purgeAfter: Date | null;
}): Promise<AccountRow | null> {
  const [row] = await db
    .update(users)
    .set({
      deletedAt: input.deletedAt,
      purgeAfter: input.purgeAfter,
      disabledAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId))
    .returning(accountShape);

  return row ?? null;
}

export async function findAccountForUser(
  userId: string,
): Promise<AccountRow | null> {
  const [row] = await db
    .select(accountShape)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return row ?? null;
}
