export const RESET_TOKEN_TTL_MINUTES = 30;
export const RESET_RESEND_COOLDOWN_MINUTES = 5;

const MINUTE_MS = 60_000;

export function resetTokenExpiry(now: Date) {
  return new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * MINUTE_MS);
}

export function resendCooldownThreshold(now: Date) {
  const remaining = RESET_TOKEN_TTL_MINUTES - RESET_RESEND_COOLDOWN_MINUTES;

  return new Date(now.getTime() + remaining * MINUTE_MS);
}

export function isResetTokenExpired(expiresAt: Date, now: Date) {
  return expiresAt.getTime() <= now.getTime();
}
