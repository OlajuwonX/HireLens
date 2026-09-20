export type ImpersonationClaim = {
  actingAdminId: string;
  targetUserId: string;
  expiresAt: string;
};

export function isClaimExpired(
  expiresAt: string | undefined,
  now: Date,
): boolean {
  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() <= now.getTime();
}
