import { timingSafeEqual } from "node:crypto";
import { getServerEnv } from "@/lib/env/server";

export function isAuthorizedCron(request: Request) {
  const expected = getServerEnv().CRON_SECRET;

  if (!expected) {
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  const offered = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(offered);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}
