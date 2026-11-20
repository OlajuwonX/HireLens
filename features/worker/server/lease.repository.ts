import "server-only";

import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applicationTaskEvents, applicationTasks } from "@/lib/db/schema";
import type { TaskState } from "@/lib/auto-apply/states";

export const LEASE_MS = 5 * 60_000;

function event(userId: string, taskId: string, from: TaskState, to: TaskState, note: string) {
  return db.insert(applicationTaskEvents).values({ userId, taskId, fromState: from, toState: to, note });
}

export async function reconcileExpiredLeases(userId: string, now = new Date()) {
  const expired = await db
    .update(applicationTasks)
    .set({
      state: "SUBMISSION_UNCONFIRMED",
      stateReason: "The worker stopped before confirming this submission. Check the employer's site or your email before applying again.",
      leaseOwner: null,
      leaseExpiresAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(applicationTasks.userId, userId),
        eq(applicationTasks.state, "SUBMITTING"),
        lt(applicationTasks.leaseExpiresAt, now),
      ),
    )
    .returning({ id: applicationTasks.id });

  await Promise.all(
    expired.map((task) => event(userId, task.id, "SUBMITTING", "SUBMISSION_UNCONFIRMED", "Worker lease expired")),
  );

  return expired.length;
}

export async function claimApprovedTask(input: { userId: string; workerId: string; now?: Date }) {
  const now = input.now ?? new Date();
  const [task] = await db
    .update(applicationTasks)
    .set({
      state: "SUBMITTING",
      stateReason: "Your local worker is filling in the application.",
      leaseOwner: input.workerId,
      leaseExpiresAt: new Date(now.getTime() + LEASE_MS),
      updatedAt: now,
    })
    .where(
      eq(
        applicationTasks.id,
        sql`(select id from ${applicationTasks}
          where user_id = ${input.userId} and state = 'APPROVED'
          order by approved_at asc nulls last
          limit 1 for update skip locked)`,
      ),
    )
    .returning();

  if (task) {
    await event(input.userId, task.id, "APPROVED", "SUBMITTING", "Claimed by your local worker");
  }

  return task ?? null;
}

function owned(input: { userId: string; publicId: string; workerId: string }) {
  return and(
    eq(applicationTasks.userId, input.userId),
    eq(applicationTasks.publicId, input.publicId),
    eq(applicationTasks.state, "SUBMITTING"),
    eq(applicationTasks.leaseOwner, input.workerId),
  );
}

export async function extendLease(input: { userId: string; publicId: string; workerId: string }) {
  const updated = await db
    .update(applicationTasks)
    .set({ leaseExpiresAt: new Date(Date.now() + LEASE_MS) })
    .where(owned(input))
    .returning({ id: applicationTasks.id });

  return updated.length > 0;
}

export async function finishLease(input: {
  userId: string;
  publicId: string;
  workerId: string;
  to: TaskState;
  reason: string;
  needs: string[];
  confirmation: Record<string, unknown> | null;
}) {
  const now = new Date();
  const [task] = await db
    .update(applicationTasks)
    .set({
      state: input.to,
      stateReason: input.reason,
      needs: input.needs,
      confirmation: input.confirmation,
      submittedAt: input.to === "SUBMITTED" ? now : null,
      leaseOwner: null,
      leaseExpiresAt: null,
      updatedAt: now,
    })
    .where(owned(input))
    .returning({ id: applicationTasks.id });

  if (task) {
    await event(input.userId, task.id, "SUBMITTING", input.to, input.reason);
  }

  return Boolean(task);
}
