import "server-only";

import { createHash } from "node:crypto";
import * as Sentry from "@sentry/nextjs";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getServerEnv } from "@/lib/env/server";

type Window = Parameters<typeof Ratelimit.slidingWindow>[1];

export const RATE_LIMIT_RULES = {
  signInIp: { tokens: 20, window: "15 m" },
  signInEmail: { tokens: 8, window: "15 m" },
  signUpIp: { tokens: 5, window: "1 h" },
  passwordResetIp: { tokens: 5, window: "15 m" },
} as const satisfies Record<string, { tokens: number; window: Window }>;

export type RateLimitRule = keyof typeof RATE_LIMIT_RULES;

const REDIS_TIMEOUT_MS = 1_500;

let redis: Redis | null | undefined;
const limiters = new Map<RateLimitRule, Ratelimit>();

function getRedis() {
  if (redis !== undefined) {
    return redis;
  }

  const env = getServerEnv();
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;

  if (!url || !token) {
    if (process.env.VERCEL_ENV === "production") {
      Sentry.captureMessage("Rate limiting is off: Upstash is not configured", {
        level: "warning",
        tags: { source: "rate-limit" },
      });
    }

    redis = null;
    return redis;
  }

  redis = new Redis({ url, token });
  return redis;
}

function getLimiter(rule: RateLimitRule) {
  const existing = limiters.get(rule);

  if (existing) {
    return existing;
  }

  const client = getRedis();

  if (!client) {
    return null;
  }

  const { tokens, window } = RATE_LIMIT_RULES[rule];
  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `hl:rl:${rule}`,
    ephemeralCache: new Map(),
    timeout: REDIS_TIMEOUT_MS,
  });

  limiters.set(rule, limiter);
  return limiter;
}

function hashIdentifier(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function isRateLimited(
  rule: RateLimitRule,
  identifier: string,
): Promise<boolean> {
  const limiter = getLimiter(rule);

  if (!limiter) {
    return false;
  }

  try {
    const { success } = await limiter.limit(hashIdentifier(identifier));

    return !success;
  } catch (error) {
    Sentry.captureException(error, { tags: { source: "rate-limit", rule } });

    return false;
  }
}
