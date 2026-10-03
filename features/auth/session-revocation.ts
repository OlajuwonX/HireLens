export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const SESSION_ENDED_PATH = "/session-ended";

export function isSessionRevoked(
  account: { passwordChangedAt: Date | null },
  authTime: number | null | undefined,
) {
  if (!account.passwordChangedAt) {
    return false;
  }

  if (typeof authTime !== "number") {
    return true;
  }

  return authTime < account.passwordChangedAt.getTime();
}
