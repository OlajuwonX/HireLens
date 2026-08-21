import "server-only";

import {
  emailForPurpose,
  isTokenExpired,
  resendCooldownThreshold,
  scopedIdentifier,
  tokenExpiry,
  type TokenPurpose,
} from "@/features/auth/policies/verification-token";
import { createHash, randomBytes } from "node:crypto";
import {
  createVerificationToken,
  deleteExpiredVerificationTokens,
  deleteVerificationToken,
  findVerificationTokenByHash,
  hasVerificationTokenExpiringAfter,
} from "./verification-token.repository";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueToken(purpose: TokenPurpose, email: string) {
  const identifier = scopedIdentifier(purpose, email);

  await deleteExpiredVerificationTokens(identifier);

  const now = new Date();

  const alreadySent = await hasVerificationTokenExpiringAfter({
    identifier,
    threshold: resendCooldownThreshold(purpose, now),
  });

  if (alreadySent) {
    return null;
  }

  const token = randomBytes(32).toString("base64url");

  await createVerificationToken({
    identifier,
    tokenHash: hashToken(token),
    expiresAt: tokenExpiry(purpose, now),
  });

  return token;
}

export async function peekToken(purpose: TokenPurpose, token: string) {
  const record = await findVerificationTokenByHash(hashToken(token));

  if (!record || isTokenExpired(record.expiresAt, new Date())) {
    return null;
  }

  return emailForPurpose(purpose, record.identifier);
}

export async function burnToken(token: string) {
  await deleteVerificationToken(hashToken(token));
}
