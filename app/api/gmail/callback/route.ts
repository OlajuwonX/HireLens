import { NextResponse, type NextRequest } from "next/server";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { GMAIL_RESULT_PATH, GMAIL_STATE_COOKIE, readPendingState } from "@/features/responses/gmail";
import { gmailClient } from "@/features/responses/server/gmail/gmail-config";
import { finishGmailConnect } from "@/features/responses/server/gmail/gmail-oauth.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireDatabaseUser();
  const url = new URL(request.url);
  const pending = readPendingState(request.cookies.get(GMAIL_STATE_COOKIE)?.value);
  const code = url.searchParams.get("code");
  const config = gmailClient();
  const valid = Boolean(config && pending && code && url.searchParams.get("state") === pending.state);
  const result =
    valid && config && pending && code
      ? await finishGmailConnect({ userId: user.id, config, origin: url.origin, code, verifier: pending.verifier })
      : { ok: false as const };
  const response = NextResponse.redirect(`${url.origin}${GMAIL_RESULT_PATH}${result.ok ? "connected" : "failed"}`);

  response.cookies.delete({ name: GMAIL_STATE_COOKIE, path: "/api/gmail" });

  return response;
}
