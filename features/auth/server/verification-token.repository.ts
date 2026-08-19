import "server-only";

import { db } from "@/lib/db/client";
import { verificationTokens } from "@/lib/db/schema";
import { and, eq, gt, lt } from "drizzle-orm";

export async function createVerificationToken(input: {
  identifier: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  await db.insert(verificationTokens).values(input);
}

export async function findVerificationTokenByHash(tokenHash: string) {
  const [token] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.tokenHash, tokenHash))
    .limit(1);

  return token ?? null;
}

export async function deleteVerificationToken(tokenHash: string) {
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.tokenHash, tokenHash));
}

export async function deleteExpiredVerificationTokens(identifier: string) {
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier),
        lt(verificationTokens.expiresAt, new Date()),
      ),
    );
}

export async function hasVerificationTokenExpiringAfter(input: {
  identifier: string;
  threshold: Date;
}) {
  const [token] = await db
    .select({ tokenHash: verificationTokens.tokenHash })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, input.identifier),
        gt(verificationTokens.expiresAt, input.threshold),
      ),
    )
    .limit(1);

  return Boolean(token);
}
