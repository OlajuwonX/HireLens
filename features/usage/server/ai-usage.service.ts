import "server-only";

import { and, count, eq, gt, gte, isNull, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { aiUsageEvents, aiUsageReservations } from "@/lib/db/schema";
import {
  AI_BURST_LIMIT,
  AI_BURST_WINDOW_SECONDS,
  AI_RESERVATION_TTL_SECONDS,
  getDailyAllowance,
  getGlobalDailySafetyLimit,
  type AiUsageAction,
} from "@/lib/ai/usage";

export type UsageDenialReason =
  "BURST_LIMIT" | "DAILY_LIMIT" | "GLOBAL_LIMIT" | "ACTIVE_REQUEST";

export type UsageAllowanceResult =
  | { ok: true; remaining: number; resetAt: Date }
  | {
      ok: false;
      reason: UsageDenialReason;
      message: string;
      resetAt: Date;
    };

export type UsageReservation =
  | { ok: true; reservationId: string }
  | {
      ok: false;
      reason: UsageDenialReason;
      message: string;
      resetAt: Date;
    };

function startOfUtcDay(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function nextUtcDay(date = new Date()) {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

function secondsFromNow(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

function isUniqueConstraintError(error: unknown) {
  return (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "23505"
  );
}

async function countCompletedToday(input: {
  userId: string;
  action: AiUsageAction;
}) {
  const [row] = await db
    .select({ value: count() })
    .from(aiUsageEvents)
    .where(
      and(
        eq(aiUsageEvents.userId, input.userId),
        eq(aiUsageEvents.action, input.action),
        gte(aiUsageEvents.createdAt, startOfUtcDay()),
      ),
    );

  return row?.value ?? 0;
}

async function countEveryUserCompletedToday() {
  const [row] = await db
    .select({ value: count() })
    .from(aiUsageEvents)
    .where(gte(aiUsageEvents.createdAt, startOfUtcDay()));

  return row?.value ?? 0;
}

async function countBurstWindow(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(aiUsageReservations)
    .where(
      and(
        eq(aiUsageReservations.userId, userId),
        gte(
          aiUsageReservations.reservedAt,
          new Date(Date.now() - AI_BURST_WINDOW_SECONDS * 1000),
        ),
      ),
    );

  return row?.value ?? 0;
}

async function hasActiveReservation(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(aiUsageReservations)
    .where(
      and(
        eq(aiUsageReservations.userId, userId),
        gt(aiUsageReservations.expiresAt, new Date()),
        isNull(aiUsageReservations.completedAt),
        isNull(aiUsageReservations.failedAt),
      ),
    );

  return (row?.value ?? 0) > 0;
}

async function expireStaleReservations(userId: string) {
  await db
    .update(aiUsageReservations)
    .set({ failedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(aiUsageReservations.userId, userId),
        lt(aiUsageReservations.expiresAt, new Date()),
        isNull(aiUsageReservations.completedAt),
        isNull(aiUsageReservations.failedAt),
      ),
    );
}

export async function checkAllowance(input: {
  userId: string;
  action: AiUsageAction;
}): Promise<UsageAllowanceResult> {
  await expireStaleReservations(input.userId);

  if (await hasActiveReservation(input.userId)) {
    return {
      ok: false,
      reason: "ACTIVE_REQUEST",
      message: "Another AI request is already running. Try again shortly.",
      resetAt: secondsFromNow(AI_RESERVATION_TTL_SECONDS),
    };
  }

  if ((await countBurstWindow(input.userId)) >= AI_BURST_LIMIT) {
    return {
      ok: false,
      reason: "BURST_LIMIT",
      message:
        "You have reached the short-term AI request limit. Try again in about a minute.",
      resetAt: secondsFromNow(AI_BURST_WINDOW_SECONDS),
    };
  }

  const globalUsed = await countEveryUserCompletedToday();

  if (globalUsed >= getGlobalDailySafetyLimit()) {
    return {
      ok: false,
      reason: "GLOBAL_LIMIT",
      message:
        "HireLens has used its shared daily AI budget. Try again tomorrow.",
      resetAt: nextUtcDay(),
    };
  }

  const used = await countCompletedToday(input);
  const limit = getDailyAllowance(input.action);

  if (used >= limit) {
    return {
      ok: false,
      reason: "DAILY_LIMIT",
      message: "You have reached today's AI allowance for this action.",
      resetAt: nextUtcDay(),
    };
  }

  return {
    ok: true,
    remaining: Math.max(0, limit - used),
    resetAt: nextUtcDay(),
  };
}

export async function reserveUsage(input: {
  userId: string;
  action: AiUsageAction;
}): Promise<UsageReservation> {
  const allowance = await checkAllowance(input);

  if (!allowance.ok) {
    return allowance;
  }

  try {
    const [reservation] = await db
      .insert(aiUsageReservations)
      .values({
        userId: input.userId,
        action: input.action,
        expiresAt: secondsFromNow(AI_RESERVATION_TTL_SECONDS),
      })
      .returning();

    return { ok: true, reservationId: reservation.id };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        reason: "ACTIVE_REQUEST",
        message: "Another AI request is already running. Try again shortly.",
        resetAt: secondsFromNow(AI_RESERVATION_TTL_SECONDS),
      };
    }

    throw error;
  }
}

export async function completeUsage(input: {
  userId: string;
  reservationId: string;
  action: AiUsageAction;
  provider?: string | null;
  model?: string | null;
  inputHash?: string | null;
}) {
  await db.transaction(async (tx) => {
    await tx
      .update(aiUsageReservations)
      .set({ completedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(aiUsageReservations.userId, input.userId),
          eq(aiUsageReservations.id, input.reservationId),
        ),
      );

    await tx.insert(aiUsageEvents).values({
      userId: input.userId,
      action: input.action,
      status: "COMPLETED",
      provider: input.provider ?? null,
      model: input.model ?? null,
      inputHash: input.inputHash ?? null,
    });
  });
}

export async function failUsage(input: {
  userId: string;
  reservationId: string;
  action: AiUsageAction;
  provider?: string | null;
  model?: string | null;
  inputHash?: string | null;
  failureReason?: string | null;
}) {
  await db.transaction(async (tx) => {
    await tx
      .update(aiUsageReservations)
      .set({ failedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(aiUsageReservations.userId, input.userId),
          eq(aiUsageReservations.id, input.reservationId),
        ),
      );

    await tx.insert(aiUsageEvents).values({
      userId: input.userId,
      action: input.action,
      status: "FAILED",
      provider: input.provider ?? null,
      model: input.model ?? null,
      inputHash: input.inputHash ?? null,
      failureReason: input.failureReason ?? null,
    });
  });
}
