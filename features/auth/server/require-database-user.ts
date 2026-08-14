import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { findUserById } from "./user.repository";
import { requireCurrentUser } from "./require-user";
import { findOrCreateUserFromPublicProfile } from "./user.service";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
};

export async function requireDatabaseUser(): Promise<SessionUser> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  if (session.dbUserId) {
    return {
      id: session.dbUserId,
      name: session.user.name ?? null,
      email: session.user.email,
    };
  }

  const currentUser = await requireCurrentUser();
  const record = await findOrCreateUserFromPublicProfile(currentUser.user);

  return { id: record.id, name: record.name, email: record.email };
}

export async function requireVerifiedDatabaseUser() {
  const user = await requireDatabaseUser();
  const record = await findUserById(user.id);

  if (!record || record.deletedAt) {
    redirect("/sign-in");
  }

  return record;
}
