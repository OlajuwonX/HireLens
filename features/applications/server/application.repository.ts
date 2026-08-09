import "server-only";

import { and, asc, desc, eq, ilike, isNotNull, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applicationActivities,
  applications,
  jobs,
  resumeVersions,
  type Application,
  type NewApplication,
} from "@/lib/db/schema";
import type { ApplicationFilters } from "../schemas/application.schema";

const rowShape = {
  application: applications,
  jobTitle: jobs.title,
  jobCompany: jobs.company,
  jobPublicId: jobs.publicId,
  versionLabel: resumeVersions.label,
  versionPublicId: resumeVersions.publicId,
};

export type ApplicationRow = {
  application: Application;
  jobTitle: string;
  jobCompany: string;
  jobPublicId: string;
  versionLabel: string | null;
  versionPublicId: string | null;
};

export async function findApplicationForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [application] = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.userId, input.userId),
        eq(applications.publicId, input.publicId),
      ),
    )
    .limit(1);

  return application ?? null;
}

export async function findApplicationRowForUser(input: {
  userId: string;
  publicId: string;
}): Promise<ApplicationRow | null> {
  const [row] = await db
    .select(rowShape)
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .leftJoin(
      resumeVersions,
      eq(resumeVersions.id, applications.resumeVersionId),
    )
    .where(
      and(
        eq(applications.userId, input.userId),
        eq(applications.publicId, input.publicId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function findApplicationForJob(input: {
  userId: string;
  jobId: string;
}) {
  const [application] = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.userId, input.userId),
        eq(applications.jobId, input.jobId),
      ),
    )
    .limit(1);

  return application ?? null;
}

export async function listApplicationsForUser(input: {
  userId: string;
  filters: ApplicationFilters;
}): Promise<ApplicationRow[]> {
  const conditions: SQL[] = [eq(applications.userId, input.userId)];

  if (input.filters.stage) {
    conditions.push(eq(applications.stage, input.filters.stage));
  }

  if (input.filters.q) {
    const pattern = `%${input.filters.q}%`;
    const match = or(ilike(jobs.title, pattern), ilike(jobs.company, pattern));

    if (match) {
      conditions.push(match);
    }
  }

  if (input.filters.sort === "followup_asc") {
    conditions.push(isNotNull(applications.followUpAt));
  }

  const orderBy = {
    activity_desc: [desc(applications.lastActivityAt)],
    created_desc: [desc(applications.createdAt)],
    followup_asc: [asc(applications.followUpAt)],
    company_asc: [asc(jobs.company), asc(jobs.title)],
  }[input.filters.sort];

  return db
    .select(rowShape)
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .leftJoin(
      resumeVersions,
      eq(resumeVersions.id, applications.resumeVersionId),
    )
    .where(and(...conditions))
    .orderBy(...orderBy);
}

export async function createApplicationWithActivity(input: {
  values: NewApplication;
  activityTitle: string;
}) {
  return db.transaction(async (tx) => {
    const [application] = await tx
      .insert(applications)
      .values(input.values)
      .returning();

    await tx.insert(applicationActivities).values({
      userId: application.userId,
      applicationId: application.id,
      title: input.activityTitle,
    });

    return application;
  });
}

export async function updateApplicationWithActivity(input: {
  userId: string;
  publicId: string;
  values: Partial<NewApplication>;
  activities: { title: string; description?: string | null }[];
}) {
  return db.transaction(async (tx) => {
    const hasActivities = input.activities.length > 0;
    const [application] = await tx
      .update(applications)
      .set({
        ...input.values,
        ...(hasActivities ? { lastActivityAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(applications.userId, input.userId),
          eq(applications.publicId, input.publicId),
        ),
      )
      .returning();

    if (!application) {
      return null;
    }

    if (hasActivities) {
      await tx.insert(applicationActivities).values(
        input.activities.map((activity) => ({
          userId: input.userId,
          applicationId: application.id,
          title: activity.title,
          description: activity.description ?? null,
        })),
      );
    }

    return application;
  });
}

export async function listActivitiesForApplication(input: {
  userId: string;
  applicationId: string;
}) {
  return db
    .select()
    .from(applicationActivities)
    .where(
      and(
        eq(applicationActivities.userId, input.userId),
        eq(applicationActivities.applicationId, input.applicationId),
      ),
    )
    .orderBy(desc(applicationActivities.createdAt));
}

export async function deleteApplicationForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [application] = await db
    .delete(applications)
    .where(
      and(
        eq(applications.userId, input.userId),
        eq(applications.publicId, input.publicId),
      ),
    )
    .returning();

  return application ?? null;
}
