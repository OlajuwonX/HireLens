import "server-only";

import { auth } from "@/auth";
import { getAccountRecord } from "./current-account";

export type ActiveImpersonation = {
  actingAdminId: string;
  targetUserId: string;
  expiresAt: string;
};

export async function getActiveImpersonation(): Promise<ActiveImpersonation | null> {
  const session = await auth();
  return session?.impersonation ?? null;
}

export async function isImpersonating(): Promise<boolean> {
  return (await getActiveImpersonation()) !== null;
}

export async function assertNotImpersonating() {
  if (await isImpersonating()) {
    throw new Error("This action is unavailable while impersonating a user.");
  }
}

export async function getImpersonationBannerData(): Promise<{
  targetEmail: string;
  expiresAt: string;
} | null> {
  const impersonation = await getActiveImpersonation();

  if (!impersonation) {
    return null;
  }

  const target = await getAccountRecord(impersonation.targetUserId);

  if (!target) {
    return null;
  }

  return { targetEmail: target.email, expiresAt: impersonation.expiresAt };
}
