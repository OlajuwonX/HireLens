import { NextResponse } from "next/server";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { GMAIL_RESULT_PATH, GMAIL_STATE_COOKIE } from "@/features/responses/gmail";
import { gmailClient } from "@/features/responses/server/gmail/gmail-config";
import { startGmailConnect } from "@/features/responses/server/gmail/gmail-oauth.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireDatabaseUser();

  const origin = new URL(request.url).origin;
  const config = gmailClient();

  if (!config) {
    return NextResponse.redirect(`${origin}${GMAIL_RESULT_PATH}unavailable`);
  }

  const { url, pending } = startGmailConnect(config, origin);
  const response = NextResponse.redirect(url);

  response.cookies.set(GMAIL_STATE_COOKIE, JSON.stringify(pending), {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/api/gmail",
    maxAge: 600,
  });

  return response;
}
