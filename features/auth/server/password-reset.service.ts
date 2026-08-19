import "server-only";

import {
  isResetTokenExpired,
  RESET_TOKEN_TTL_MINUTES,
  resendCooldownThreshold,
  resetTokenExpiry,
} from "@/features/auth/policies/password-reset";
import { sendEmail } from "@/lib/email/brevo";
import { absoluteUrl } from "@/lib/seo/site";
import { createHash, randomBytes } from "node:crypto";
import { normalizeEmail } from "./email";
import { hashPassword } from "./password";
import {
  findUserByEmail,
  markEmailVerified,
  setUserPasswordHash,
} from "./user.repository";
import {
  createVerificationToken,
  deleteExpiredVerificationTokens,
  deleteVerificationToken,
  findVerificationTokenByHash,
  hasVerificationTokenExpiringAfter,
} from "./verification-token.repository";

export type ResetResult = { ok: true } | { ok: false; message: string };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function resetEmailHtml(link: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f7f8f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#161a18">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #dde1dd;border-radius:6px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600">Reset your password</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#646b67">
        Someone asked to reset the HireLens password for this address. Choose a new
        password using the button below. This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes.
      </p>
      <a href="${link}" style="display:inline-block;padding:12px 20px;background:#161a18;color:#ffffff;text-decoration:none;border-radius:2px;font-size:15px;font-weight:500">
        Choose a new password
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8b928e">
        If you did not ask for this, you can ignore this email. Your password stays
        as it is until you use the link above.
      </p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#8b928e;word-break:break-all">
        ${link}
      </p>
    </div>
  </body>
</html>`;
}

export async function requestPasswordReset(rawEmail: string) {
  const identifier = normalizeEmail(rawEmail);

  await deleteExpiredVerificationTokens(identifier);

  const user = await findUserByEmail(identifier);

  if (!user || user.deletedAt || !user.passwordHash) {
    return;
  }

  const now = new Date();

  const alreadySent = await hasVerificationTokenExpiringAfter({
    identifier,
    threshold: resendCooldownThreshold(now),
  });

  if (alreadySent) {
    return;
  }

  const token = randomBytes(32).toString("base64url");

  await createVerificationToken({
    identifier,
    tokenHash: hashToken(token),
    expiresAt: resetTokenExpiry(now),
  });

  await sendEmail({
    to: identifier,
    subject: "HireLens — Reset your password",
    html: resetEmailHtml(absoluteUrl(`/reset-password?token=${token}`)),
  });
}

export async function isResetTokenUsable(token: string) {
  const record = await findVerificationTokenByHash(hashToken(token));

  return Boolean(record && !isResetTokenExpired(record.expiresAt, new Date()));
}

export async function completePasswordReset(input: {
  token: string;
  password: string;
}): Promise<ResetResult> {
  const tokenHash = hashToken(input.token);
  const record = await findVerificationTokenByHash(tokenHash);

  if (!record || isResetTokenExpired(record.expiresAt, new Date())) {
    return {
      ok: false,
      message: "That reset link has expired. Request a new one.",
    };
  }

  const user = await findUserByEmail(record.identifier);

  if (!user || user.deletedAt) {
    await deleteVerificationToken(tokenHash);

    return {
      ok: false,
      message: "That reset link is no longer valid. Request a new one.",
    };
  }

  await setUserPasswordHash({
    userId: user.id,
    passwordHash: await hashPassword(input.password),
  });

  if (!user.emailVerifiedAt) {
    await markEmailVerified({ userId: user.id });
  }

  await deleteVerificationToken(tokenHash);

  return { ok: true };
}
