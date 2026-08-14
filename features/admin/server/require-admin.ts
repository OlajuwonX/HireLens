import "server-only";

import { auth } from "@/auth";
import { findUserById } from "@/features/auth/server/user.repository";
import { notFound, redirect } from "next/navigation";
import { OPS_CONSOLE_PATH } from "../constants";

export { OPS_CONSOLE_PATH };

export type AdminUser = {
  id: string;
  email: string;
};

export async function requireAdminUser(): Promise<AdminUser> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  const id = session.dbUserId;

  if (!id) {
    notFound();
  }

  const record = await findUserById(id);

  if (!record || record.deletedAt || record.role !== "ADMIN") {
    notFound();
  }

  return { id: record.id, email: record.email };
}

export async function viewerIsAdmin() {
  const session = await auth();

  if (!session?.dbUserId) {
    return false;
  }

  const record = await findUserById(session.dbUserId);

  return Boolean(record && !record.deletedAt && record.role === "ADMIN");
}
