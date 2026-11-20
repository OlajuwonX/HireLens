import "server-only";

import { and, count, desc, eq, gte, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applicationTaskEvents, applicationTasks, applications, jobs } from "@/lib/db/schema";
import type { TaskState } from "@/lib/auto-apply/states";

const taskShape = {
  id: applicationTasks.id,
  publicId: applicationTasks.publicId,
  state: applicationTasks.state,
  stateReason: applicationTasks.stateReason,
  needs: applicationTasks.needs,
  platform: applicationTasks.platform,
  approvedAt: applicationTasks.approvedAt,
  submittedAt: applicationTasks.submittedAt,
  updatedAt: applicationTasks.updatedAt,
  applicationPublicId: applications.publicId,
  title: jobs.title,
  company: jobs.company,
  sourceUrl: jobs.sourceUrl,
};

function withJob() {
  return db
    .select(taskShape)
    .from(applicationTasks)
    .innerJoin(applications, eq(applications.id, applicationTasks.applicationId))
    .innerJoin(jobs, eq(jobs.id, applications.jobId));
}

export async function createTask(values: typeof applicationTasks.$inferInsert) {
  return db.transaction(async (tx) => {
    const [task] = await tx.insert(applicationTasks).values(values).onConflictDoNothing().returning();

    if (task) {
      await tx.insert(applicationTaskEvents).values({
        userId: task.userId,
        taskId: task.id,
        fromState: null,
        toState: task.state,
        note: "Added to Auto Apply",
      });
    }

    return task ?? null;
  });
}

export async function findTaskForUser(input: { userId: string; publicId: string }) {
  const [task] = await withJob()
    .where(and(eq(applicationTasks.userId, input.userId), eq(applicationTasks.publicId, input.publicId)))
    .limit(1);

  return task ?? null;
}

export async function findTaskByApplication(input: { userId: string; applicationId: string }) {
  const [task] = await withJob()
    .where(and(eq(applicationTasks.userId, input.userId), eq(applicationTasks.applicationId, input.applicationId)))
    .limit(1);

  return task ?? null;
}

export async function listTasksForUser(userId: string) {
  return withJob()
    .where(and(eq(applicationTasks.userId, userId), ne(applicationTasks.state, "CANCELLED")))
    .orderBy(desc(applicationTasks.updatedAt))
    .limit(200);
}

export type TaskRow = Awaited<ReturnType<typeof listTasksForUser>>[number];

export async function transitionTask(input: {
  userId: string;
  taskId: string;
  from: TaskState;
  to: TaskState;
  reason: string | null;
  needs?: string[];
  patch?: Partial<typeof applicationTasks.$inferInsert>;
}) {
  return db.transaction(async (tx) => {
    const [task] = await tx
      .update(applicationTasks)
      .set({
        ...input.patch,
        state: input.to,
        stateReason: input.reason,
        needs: input.needs ?? [],
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(applicationTasks.id, input.taskId),
          eq(applicationTasks.userId, input.userId),
          eq(applicationTasks.state, input.from),
        ),
      )
      .returning({ id: applicationTasks.id });

    if (!task) {
      return false;
    }

    await tx.insert(applicationTaskEvents).values({
      userId: input.userId,
      taskId: input.taskId,
      fromState: input.from,
      toState: input.to,
      note: input.reason,
    });

    return true;
  });
}

export async function countSubmittedToday(userId: string) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [row] = await db
    .select({ value: count() })
    .from(applicationTasks)
    .where(and(eq(applicationTasks.userId, userId), gte(applicationTasks.submittedAt, startOfDay)));

  return row?.value ?? 0;
}

export async function countCommittedToday(userId: string) {
  const [pending] = await db
    .select({ value: count() })
    .from(applicationTasks)
    .where(and(eq(applicationTasks.userId, userId), inArray(applicationTasks.state, ["APPROVED", "SUBMITTING"])));

  return (await countSubmittedToday(userId)) + (pending?.value ?? 0);
}

export async function findCommittedRole(input: { userId: string; roleKey: string }) {
  const [task] = await db
    .select({ id: applicationTasks.id })
    .from(applicationTasks)
    .where(
      and(
        eq(applicationTasks.userId, input.userId),
        eq(applicationTasks.roleKey, input.roleKey),
        inArray(applicationTasks.state, ["APPROVED", "SUBMITTING", "SUBMITTED", "SUBMISSION_UNCONFIRMED"]),
      ),
    )
    .limit(1);

  return task ?? null;
}

export async function listRecentEvents(input: { userId: string; taskIds: string[] }) {
  if (input.taskIds.length === 0) {
    return [];
  }

  return db
    .select({
      taskId: applicationTaskEvents.taskId,
      toState: applicationTaskEvents.toState,
      note: applicationTaskEvents.note,
      createdAt: applicationTaskEvents.createdAt,
    })
    .from(applicationTaskEvents)
    .where(and(eq(applicationTaskEvents.userId, input.userId), inArray(applicationTaskEvents.taskId, input.taskIds)))
    .orderBy(desc(applicationTaskEvents.createdAt))
    .limit(500);
}
