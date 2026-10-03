import "server-only";

import { auth } from "@/auth";
import {
  blockedAccountRoute,
  resolveAccountState,
} from "@/features/auth/account-state";
import { getAccountRecord } from "@/features/auth/server/current-account";
import { isSessionRevoked } from "@/features/auth/session-revocation";

export type SearchIdentity =
  | { status: "ok"; userId: string }
  | { status: "unauthenticated" }
  | { status: "blocked" };

export async function resolveSearchIdentity(): Promise<SearchIdentity> {
  const session = await auth();

  if (!session?.user?.email || !session.dbUserId) {
    return { status: "unauthenticated" };
  }

  const real = await getAccountRecord(session.dbUserId);

  if (!real || isSessionRevoked(real, session.authTime)) {
    return { status: "unauthenticated" };
  }

  if (blockedAccountRoute(resolveAccountState(real))) {
    return { status: "blocked" };
  }

  const impersonation = session.impersonation;

  if (impersonation) {
    const target = await getAccountRecord(impersonation.targetUserId);

    if (target) {
      return { status: "ok", userId: target.id };
    }
  }

  return { status: "ok", userId: real.id };
}
