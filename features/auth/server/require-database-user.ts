import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  blockedAccountRoute,
  resolveAccountState,
} from "@/features/auth/account-state";
import {
  isSessionRevoked,
  SESSION_ENDED_PATH,
} from "@/features/auth/session-revocation";
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
    const record = await getAccountRecord(session.dbUserId);

    if (record && isSessionRevoked(record, session.authTime)) {
      redirect(SESSION_ENDED_PATH);
    }

    return session.dbUserId;
  }

  const record = await findOrCreateUserFromPublicProfile(
    (await requireCurrentUser()).user,
  );

  return record.id;
}

async function requireRealAccountRecord() {
  const userId = await requireSessionUserId();
  const record = await getAccountRecord(userId);

  if (!record) {
    redirect("/sign-in");
  }

  const blocked = blockedAccountRoute(resolveAccountState(record));

  if (blocked) {
    redirect(blocked);
  }

  return record;
}

export async function requireRealDatabaseUser(): Promise<SessionUser> {
  const record = await requireRealAccountRecord();

  return { id: record.id, name: record.name, email: record.email };
}

export async function requireDatabaseUser(): Promise<SessionUser> {
  const realRecord = await requireRealAccountRecord();

  const session = await auth();
  const impersonation = session?.impersonation;

  if (impersonation) {
    const targetRecord = await getAccountRecord(impersonation.targetUserId);

    if (targetRecord) {
      return {
        id: targetRecord.id,
        name: targetRecord.name,
        email: targetRecord.email,
      };
    }
  }

  return { id: realRecord.id, name: realRecord.name, email: realRecord.email };
}

export async function requireVerifiedDatabaseUser() {
  const user = await requireDatabaseUser();
  const record = await getAccountRecord(user.id);

  if (!record || record.deletedAt) {
    redirect("/sign-in");
  }

  return record;
}
