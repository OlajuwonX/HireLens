import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applicationActivities,
  applications,
  jobs,
  resumeVersions,
  resumes,
  applicationAnalyses,
  type Application,
  type NewApplication,
  type NewJob,
} from "@/lib/db/schema";
import type { ApplicationFilters } from "../schemas/application.schema";

const rowShape = {
  application: applications,
  job: jobs,
  versionLabel: resumeVersions.label,
  versionPublicId: resumeVersions.publicId,
  resumeTitle: resumes.title,
  matchScore: applicationAnalyses.overallScore,
  analysisPublicId: applicationAnalyses.publicId,
};

export type ApplicationRow = {
  application: Application;
  job: typeof jobs.$inferSelect;
  versionLabel: string | null;
  versionPublicId: string | null;
  resumeTitle: string | null;
  matchScore: number | null;
  analysisPublicId: string | null;
};

const listRowShape = {
  publicId: applications.publicId,
  status: applications.status,
  createdAt: applications.createdAt,
  title: jobs.title,
  company: jobs.company,
  deadlineAt: jobs.deadlineAt,
  versionLabel: resumeVersions.label,
  matchScore: applicationAnalyses.overallScore,
};

export type ApplicationListRow = {
  publicId: string;
  status: Application["status"];
  createdAt: Date;
  title: string;
  company: string;
  deadlineAt: Date | null;
  versionLabel: string | null;
  matchScore: number | null;
};

function listQuery() {
  return db
    .select(listRowShape)
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .leftJoin(resumeVersions, eq(resumeVersions.id, applications.resumeVersionId))
    .leftJoin(
      applicationAnalyses,
      eq(applicationAnalyses.id, applications.analysisId),
    );
}

function baseQuery() {
  return db
    .select(rowShape)
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .leftJoin(
      resumeVersions,
      eq(resumeVersions.id, applications.resumeVersionId),
    )
    .leftJoin(resumes, eq(resumes.id, resumeVersions.resumeId))
    .leftJoin(applicationAnalyses, eq(applicationAnalyses.id, applications.analysisId));
}

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
  const [row] = await baseQuery()
    .where(
      and(
        eq(applications.userId, input.userId),
        eq(applications.publicId, input.publicId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function listApplicationsForUser(input: {
  userId: string;
  filters: ApplicationFilters;
  limit?: number;
  offset?: number;
}): Promise<ApplicationListRow[]> {
  const conditions: SQL[] = [eq(applications.userId, input.userId)];

  if (input.filters.tab !== "ALL") {
    conditions.push(eq(applications.status, input.filters.tab));
  }

  if (input.filters.q) {
    const pattern = `%${input.filters.q}%`;
    const match = or(ilike(jobs.title, pattern), ilike(jobs.company, pattern));

    if (match) {
      conditions.push(match);
    }
  }

  if (input.filters.from) {
    conditions.push(gte(applications.createdAt, new Date(input.filters.from)));
  }

  if (input.filters.to) {
    const end = new Date(input.filters.to);

    end.setDate(end.getDate() + 1);
    conditions.push(lt(applications.createdAt, end));
  }

  if (input.filters.sort === "deadline_asc") {
    conditions.push(isNotNull(jobs.deadlineAt));
  }

  if (input.filters.sort === "score_desc") {
    conditions.push(isNotNull(applicationAnalyses.overallScore));
  }

  const orderBy = {
    activity_desc: [desc(applications.lastActivityAt)],
    created_desc: [desc(applications.createdAt)],
    deadline_asc: [asc(jobs.deadlineAt)],
    score_desc: [desc(applicationAnalyses.overallScore)],
    company_asc: [asc(jobs.company), asc(jobs.title)],
  }[input.filters.sort];

  return listQuery()
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(input.limit ?? 1000)
    .offset(input.offset ?? 0);
}

export async function countApplicationsByStatus(userId: string) {
  const rows = await db
    .select({ status: applications.status, id: applications.id })
    .from(applications)
    .where(eq(applications.userId, userId));

  return rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    return counts;
  }, {});
}

export async function createJobWithApplication(input: {
  userId: string;
  job: Omit<NewJob, "userId">;
  resumeVersionId: string;
  activityTitle: string;
}) {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .insert(jobs)
      .values({ ...input.job, userId: input.userId })
      .returning();

    const [application] = await tx
      .insert(applications)
      .values({
        userId: input.userId,
        jobId: job.id,
        resumeVersionId: input.resumeVersionId,
        status: "PENDING",
      })
      .returning();

    await tx.insert(applicationActivities).values({
      userId: input.userId,
      applicationId: application.id,
      title: input.activityTitle,
    });

    return { job, application };
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

export async function attachAnalysisToApplication(input: {
  userId: string;
  applicationId: string;
  analysisId: string;
}) {
  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({
        analysisId: input.analysisId,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(applications.userId, input.userId),
          eq(applications.id, input.applicationId),
        ),
      );

    await tx.insert(applicationActivities).values({
      userId: input.userId,
      applicationId: input.applicationId,
      title: "Analysis completed",
    });
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
