import "server-only";

import { TOKEN_TTL_MINUTES } from "@/features/auth/policies/verification-token";
import { sendEmail } from "@/lib/email/brevo";
import { absoluteUrl } from "@/lib/seo/site";
import { normalizeEmail } from "./email";
import { hashPassword } from "./password";
import {
  findUserByEmail,
  markEmailVerified,
  setUserPasswordHash,
} from "./user.repository";
import { burnToken, issueToken, peekToken } from "./verification-token.service";

export type ResetResult = { ok: true } | { ok: false; message: string };

const EXPIRED_MESSAGE = "That reset link has expired. Request a new one.";

function resetEmailHtml(link: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f7f8f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#161a18">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #dde1dd;border-radius:6px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600">Reset your password</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#646b67">
        Someone asked to reset the HireLens password for this address. Choose a new
        password using the button below. This link expires in ${TOKEN_TTL_MINUTES.reset} minutes.
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
  const email = normalizeEmail(rawEmail);
  const user = await findUserByEmail(email);

  if (!user || user.deletedAt || !user.passwordHash) {
    return;
  }

  const token = await issueToken("reset", email);

  if (!token) {
    return;
  }

  await sendEmail({
    to: email,
    subject: "HireLens — Reset your password",
    html: resetEmailHtml(absoluteUrl(`/reset-password?token=${token}`)),
  });
}

export async function isResetTokenUsable(token: string) {
  return Boolean(await peekToken("reset", token));
}

export async function completePasswordReset(input: {
  token: string;
  password: string;
}): Promise<ResetResult> {
  const email = await peekToken("reset", input.token);

  if (!email) {
    return { ok: false, message: EXPIRED_MESSAGE };
  }

  const user = await findUserByEmail(email);

  if (!user || user.deletedAt) {
    await burnToken(input.token);

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

  await burnToken(input.token);

  return { ok: true };
}
