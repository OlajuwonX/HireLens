import { createHash, randomBytes } from "node:crypto";

export const TOKEN_PREFIX = "hlw_";

export function hashWorkerToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateWorkerToken() {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;

  return { token, hash: hashWorkerToken(token) };
}

export function readBearer(header: string | null) {
  const value = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";

  return value.startsWith(TOKEN_PREFIX) && value.length < 200 ? value : null;
}
