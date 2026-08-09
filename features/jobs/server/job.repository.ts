import "server-only";

import { and, asc, desc, eq, ilike, isNotNull, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs, type Job, type NewJob } from "@/lib/db/schema";
import type { JobFilters } from "../schemas/job.schema";

export async function findJobForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.userId, input.userId), eq(jobs.publicId, input.publicId)))
    .limit(1);

  return job ?? null;
}

export async function listJobsForUser(input: {
  userId: string;
  filters: JobFilters;
}) {
  const conditions: SQL[] = [eq(jobs.userId, input.userId)];

  if (input.filters.status) {
    conditions.push(eq(jobs.status, input.filters.status));
  }

  if (input.filters.arrangement) {
    conditions.push(eq(jobs.workArrangement, input.filters.arrangement));
  }

  if (input.filters.q) {
    const pattern = `%${input.filters.q}%`;
    const match = or(
      ilike(jobs.title, pattern),
      ilike(jobs.company, pattern),
      ilike(jobs.location, pattern),
    );

    if (match) {
      conditions.push(match);
    }
  }

  const orderBy = {
    created_desc: [desc(jobs.createdAt)],
    created_asc: [asc(jobs.createdAt)],
    deadline_asc: [asc(jobs.deadlineAt), desc(jobs.createdAt)],
    company_asc: [asc(jobs.company), asc(jobs.title)],
    title_asc: [asc(jobs.title), asc(jobs.company)],
  }[input.filters.sort];

  if (input.filters.sort === "deadline_asc") {
    conditions.push(isNotNull(jobs.deadlineAt));
  }

  return db
    .select()
    .from(jobs)
    .where(and(...conditions))
    .orderBy(...orderBy);
}

export async function createJob(input: NewJob) {
  const [job] = await db.insert(jobs).values(input).returning();
  return job;
}

export async function updateJobForUser(input: {
  userId: string;
  publicId: string;
  values: Partial<NewJob>;
}) {
  const [job] = await db
    .update(jobs)
    .set({ ...input.values, updatedAt: new Date() })
    .where(and(eq(jobs.userId, input.userId), eq(jobs.publicId, input.publicId)))
    .returning();

  return job ?? null;
}

export async function setJobStatusForUser(input: {
  userId: string;
  publicId: string;
  status: Job["status"];
}) {
  const [job] = await db
    .update(jobs)
    .set({
      status: input.status,
      archivedAt: input.status === "ARCHIVED" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.userId, input.userId), eq(jobs.publicId, input.publicId)))
    .returning();

  return job ?? null;
}

export async function deleteJobForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [job] = await db
    .delete(jobs)
    .where(and(eq(jobs.userId, input.userId), eq(jobs.publicId, input.publicId)))
    .returning();

  return job ?? null;
}
