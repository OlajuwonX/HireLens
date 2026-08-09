export function shouldClearUntrustedPassword(user: {
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
}) {
  return !user.emailVerifiedAt && Boolean(user.passwordHash);
}
