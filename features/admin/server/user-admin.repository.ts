import "server-only";

import { and, asc, count, desc, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, type UserRole } from "@/lib/db/schema";
import type { UserSortKey } from "@/features/admin/schemas/user-search.schema";
import { likePattern } from "@/lib/search/query";

const listRowShape = {
  publicId: users.publicId,
  name: users.name,
  email: users.email,
  role: users.role,
  emailVerifiedAt: users.emailVerifiedAt,
  disabledAt: users.disabledAt,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
};

export type AdminUserListRow = {
  publicId: string;
  name: string | null;
  email: string;
  role: UserRole;
  emailVerifiedAt: Date | null;
  disabledAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
};

const sortColumns = {
  name: users.name,
  createdAt: users.createdAt,
  lastLoginAt: users.lastLoginAt,
} satisfies Record<UserSortKey, unknown>;

export async function listUsers(input: {
  q?: string;
  sort?: UserSortKey;
  dir?: "asc" | "desc";
  limit: number;
  offset: number;
}): Promise<AdminUserListRow[]> {
  const conditions = [isNull(users.deletedAt)];

  if (input.q) {
    const term = likePattern(input.q);
    conditions.push(or(ilike(users.name, term), ilike(users.email, term))!);
  }

  const sortColumn = sortColumns[input.sort ?? "createdAt"];
  const order = input.dir === "asc" ? asc : desc;

  return db
    .select(listRowShape)
    .from(users)
    .where(and(...conditions))
    .orderBy(order(sortColumn))
    .limit(input.limit)
    .offset(input.offset);
}

export async function countUserMetrics() {
  const [row] = await db
    .select({
      total: count(),
      verified: count(users.emailVerifiedAt),
      disabled: count(users.disabledAt),
    })
    .from(users)
    .where(isNull(users.deletedAt));

  const total = row?.total ?? 0;
  const verified = row?.verified ?? 0;

  return {
    total,
    verified,
    unverified: total - verified,
    disabled: row?.disabled ?? 0,
  };
}

export async function countAdmins() {
  const [row] = await db
    .select({ value: count() })
    .from(users)
    .where(and(eq(users.role, "ADMIN"), isNull(users.deletedAt)));

  return row?.value ?? 0;
}

export async function findUserByPublicId(publicId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.publicId, publicId))
    .limit(1);

  return user ?? null;
}

export async function setUserRole(input: { publicId: string; role: UserRole }) {
  const [user] = await db
    .update(users)
    .set({ role: input.role, updatedAt: new Date() })
    .where(eq(users.publicId, input.publicId))
    .returning();

  return user ?? null;
}

export async function setUserDisabled(input: {
  publicId: string;
  disabled: boolean;
}) {
  const [user] = await db
    .update(users)
    .set({
      disabledAt: input.disabled ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(users.publicId, input.publicId))
    .returning();

  return user ?? null;
}
