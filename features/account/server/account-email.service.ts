import "server-only";

import { sendEmail } from "@/lib/email/brevo";
import { absoluteUrl } from "@/lib/seo/site";
import { formatPurgeDate } from "../constants";

function shell(input: { heading: string; body: string; footer: string }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f7f8f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#161a18">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #dde1dd;border-radius:6px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600">${input.heading}</h1>
      ${input.body}
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#8b928e">
        ${input.footer}
      </p>
    </div>
  </body>
</html>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#646b67">${text}</p>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:12px 20px;background:#161a18;color:#ffffff;text-decoration:none;border-radius:2px;font-size:15px;font-weight:500">${label}</a>`;
}

export async function sendAccountDisabledEmail(to: string) {
  return sendEmail({
    to,
    subject: "HireLens — Your account is paused",
    html: shell({
      heading: "Your account is paused",
      body:
        paragraph(
          "HireLens is on hold for your account. The dashboard is unavailable until you turn it back on.",
        ) +
        paragraph(
          "Nothing has been deleted. Your resumes, saved jobs, applications and documents are all still here, exactly as you left them.",
        ) +
        button(absoluteUrl("/account/paused"), "Reactivate my account"),
      footer:
        "If you did not pause this account, sign in and reactivate it, then change your password.",
    }),
  });
}

export async function sendAccountReactivatedEmail(to: string) {
  return sendEmail({
    to,
    subject: "HireLens — Your account is active again",
    html: shell({
      heading: "Your account is active again",
      body:
        paragraph(
          "Your HireLens account has been reactivated and everything is back where you left it.",
        ) + button(absoluteUrl("/dashboard"), "Open HireLens"),
      footer:
        "If you did not do this, change your password straight away and tell us through Help.",
    }),
  });
}

export async function sendDeletionRequestedEmail(input: {
  to: string;
  purgeAfter: Date;
}) {
  const on = formatPurgeDate(input.purgeAfter);

  return sendEmail({
    to: input.to,
    subject: "HireLens — Your account is scheduled for deletion",
    html: shell({
      heading: "Your account is scheduled for deletion",
      body:
        paragraph(
          `Your HireLens account is now closed and will be permanently deleted on <strong>${on}</strong>.`,
        ) +
        paragraph(
          "Until then your resumes, saved jobs, applications, documents and files are still stored and can be brought back. After that date they are gone for good and cannot be recovered.",
        ) +
        button(absoluteUrl("/account/scheduled"), "Restore my account"),
      footer:
        "If you did not ask for this, restore the account now and change your password.",
    }),
  });
}

export async function sendDeletionRestoredEmail(to: string) {
  return sendEmail({
    to,
    subject: "HireLens — Your account has been restored",
    html: shell({
      heading: "Your account has been restored",
      body:
        paragraph(
          "The scheduled deletion has been cancelled and nothing was removed. Your account is active again and everything is where you left it.",
        ) + button(absoluteUrl("/dashboard"), "Open HireLens"),
      footer:
        "If you did not do this, change your password straight away and tell us through Help.",
    }),
  });
}

export async function sendDeletionFinalWarningEmail(input: {
  to: string;
  purgeAfter: Date;
}) {
  const on = formatPurgeDate(input.purgeAfter);

  return sendEmail({
    to: input.to,
    subject: "HireLens — Your data is deleted in a few days",
    html: shell({
      heading: "Last chance to keep your data",
      body:
        paragraph(
          `Your HireLens account is scheduled for permanent deletion on <strong>${on}</strong>. This is the last reminder you will get.`,
        ) +
        paragraph(
          "Restoring takes one click and brings back every resume, saved job, application and document. After that date nothing can be recovered.",
        ) +
        button(absoluteUrl("/account/scheduled"), "Restore my account"),
      footer:
        "If you meant to delete the account, you do not need to do anything.",
    }),
  });
}
