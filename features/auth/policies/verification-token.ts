export const TOKEN_PURPOSES = ["reset", "verify"] as const;

export type TokenPurpose = (typeof TOKEN_PURPOSES)[number];

export const TOKEN_TTL_MINUTES: Record<TokenPurpose, number> = {
  reset: 30,
  verify: 60 * 24,
};

export const RESEND_COOLDOWN_MINUTES = 5;

const MINUTE_MS = 60_000;

export function scopedIdentifier(purpose: TokenPurpose, email: string) {
  return `${purpose}:${email}`;
}

export function emailForPurpose(purpose: TokenPurpose, identifier: string) {
  const prefix = `${purpose}:`;

  if (!identifier.startsWith(prefix)) {
    return null;
  }

  const email = identifier.slice(prefix.length);

  return email.length > 0 ? email : null;
}

export function tokenExpiry(purpose: TokenPurpose, now: Date) {
  return new Date(now.getTime() + TOKEN_TTL_MINUTES[purpose] * MINUTE_MS);
}

export function resendCooldownThreshold(purpose: TokenPurpose, now: Date) {
  const remaining = TOKEN_TTL_MINUTES[purpose] - RESEND_COOLDOWN_MINUTES;

  return new Date(now.getTime() + remaining * MINUTE_MS);
}

export function isTokenExpired(expiresAt: Date, now: Date) {
  return expiresAt.getTime() <= now.getTime();
}
