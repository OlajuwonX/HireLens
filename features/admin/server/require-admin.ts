import "server-only";

import { notFound } from "next/navigation";
import { getAccountRecord } from "@/features/auth/server/current-account";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { OPS_CONSOLE_PATH } from "../constants";

export { OPS_CONSOLE_PATH };

export type AdminUser = {
  id: string;
  email: string;
};

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await requireDatabaseUser();
  const record = await getAccountRecord(user.id);

  if (!record || record.deletedAt || record.role !== "ADMIN") {
    notFound();
  }

  return { id: record.id, email: record.email };
}
