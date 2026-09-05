import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  blockedAccountRoute,
  resolveAccountState,
} from "@/features/auth/account-state";
import { getAccountRecord } from "./current-account";
import { requireCurrentUser } from "./require-user";
import { findOrCreateUserFromPublicProfile } from "./user.service";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
};

export async function requireSessionUserId(): Promise<string> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  if (session.dbUserId) {
    return session.dbUserId;
  }

  const record = await findOrCreateUserFromPublicProfile(
    (await requireCurrentUser()).user,
  );

  return record.id;
}

export async function requireDatabaseUser(): Promise<SessionUser> {
  const userId = await requireSessionUserId();
  const record = await getAccountRecord(userId);

  if (!record) {
    redirect("/sign-in");
  }

  const blocked = blockedAccountRoute(resolveAccountState(record));

  if (blocked) {
    redirect(blocked);
  }

  return { id: record.id, name: record.name, email: record.email };
}

export async function requireVerifiedDatabaseUser() {
  const user = await requireDatabaseUser();
  const record = await getAccountRecord(user.id);

  if (!record || record.deletedAt) {
    redirect("/sign-in");
  }

  return record;
}
