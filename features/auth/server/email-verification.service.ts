import "server-only";

import { sendEmail } from "@/lib/email/brevo";
import { absoluteUrl } from "@/lib/seo/site";
import { normalizeEmail } from "./email";
import { findUserByEmail, markEmailVerified } from "./user.repository";
import { burnToken, issueToken, peekToken } from "./verification-token.service";

export type VerificationResult = { ok: true } | { ok: false; message: string };

function verificationEmailHtml(link: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f7f8f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#161a18">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #dde1dd;border-radius:6px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600">Confirm your email address</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#646b67">
        Confirming this address keeps your password on your HireLens account for
        good, so you can sign in with either your password or Google.
      </p>
      <a href="${link}" style="display:inline-block;padding:12px 20px;background:#161a18;color:#ffffff;text-decoration:none;border-radius:2px;font-size:15px;font-weight:500">
        Confirm this address
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8b928e">
        If you did not ask for this, you can ignore this email. Nothing changes
        until you use the link above.
      </p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#8b928e;word-break:break-all">
        ${link}
      </p>
    </div>
  </body>
</html>`;
}

export async function requestEmailVerification(
  rawEmail: string,
): Promise<VerificationResult> {
  const email = normalizeEmail(rawEmail);
  const user = await findUserByEmail(email);

  if (!user || user.deletedAt) {
    return { ok: false, message: "That account is no longer available." };
  }

  if (user.emailVerifiedAt) {
    return { ok: false, message: "This address is already confirmed." };
  }

  const token = await issueToken("verify", email);

  if (!token) {
    return {
      ok: false,
      message: "We already sent a link. Check your inbox, then your spam.",
    };
  }

  const sent = await sendEmail({
    to: email,
    subject: "HireLens — Confirm your email address",
    html: verificationEmailHtml(absoluteUrl(`/verify-email?token=${token}`)),
  });

  if (!sent) {
    return {
      ok: false,
      message: "We could not send that email just now. Try again shortly.",
    };
  }

  return { ok: true };
}

export async function isVerificationTokenUsable(token: string) {
  return Boolean(await peekToken("verify", token));
}

export async function completeEmailVerification(
  token: string,
): Promise<VerificationResult> {
  const email = await peekToken("verify", token);

  if (!email) {
    return {
      ok: false,
      message: "That confirmation link has expired. Request a new one.",
    };
  }

  const user = await findUserByEmail(email);

  if (!user || user.deletedAt) {
    await burnToken(token);

    return {
      ok: false,
      message: "That confirmation link is no longer valid.",
    };
  }

  if (!user.emailVerifiedAt) {
    await markEmailVerified({ userId: user.id });
  }

  await burnToken(token);

  return { ok: true };
}
