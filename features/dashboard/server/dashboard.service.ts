import "server-only";

import { and, avg, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applications,
  aiUsageEvents,
  generatedDocuments,
  jobs,
  applicationAnalyses,
  resumes,
  resumeVersions,
} from "@/lib/db/schema";
import {
  AI_USAGE_ACTIONS,
  getDailyAllowance,
  usageActionLabels,
} from "@/lib/ai/usage";

function startOfUtcDay(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

async function countResumeGroups(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(resumes)
    .where(eq(resumes.userId, userId));

  return row?.value ?? 0;
}

async function countResumeVersions(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(resumeVersions)
    .where(eq(resumeVersions.userId, userId));

  return row?.value ?? 0;
}

async function countApplications(userId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(applications)
    .where(eq(applications.userId, userId));

  return row?.value ?? 0;
}

export async function getDashboardSummary(userId: string) {
  const [
    resumeGroupCount,
    resumeVersionCount,
    applicationCount,
    statusRows,
    recentApplications,
    recentDocuments,
    averageMatchRows,
    usageRows,
  ] = await Promise.all([
    countResumeGroups(userId),
    countResumeVersions(userId),
    countApplications(userId),
    db
      .select({ status: applications.status, value: count() })
      .from(applications)
      .where(eq(applications.userId, userId))
      .groupBy(applications.status),
    db
      .select({
        publicId: applications.publicId,
        status: applications.status,
        title: jobs.title,
        company: jobs.company,
      })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.lastActivityAt))
      .limit(5),
    db
      .select({
        publicId: generatedDocuments.publicId,
        type: generatedDocuments.type,
        createdAt: generatedDocuments.createdAt,
      })
      .from(generatedDocuments)
      .where(eq(generatedDocuments.userId, userId))
      .orderBy(desc(generatedDocuments.createdAt))
      .limit(5),
    db
      .select({ value: avg(applicationAnalyses.overallScore) })
      .from(applicationAnalyses)
      .where(
        and(
          eq(applicationAnalyses.userId, userId),
          eq(applicationAnalyses.status, "SUCCEEDED"),
        ),
      ),
    db
      .select()
      .from(aiUsageEvents)
      .where(
        and(
          eq(aiUsageEvents.userId, userId),
          gte(aiUsageEvents.createdAt, startOfUtcDay()),
        ),
      ),
  ]);

  const statusCounts = statusRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row.value;
    return acc;
  }, {});
  const usage = AI_USAGE_ACTIONS.map((action) => ({
    action,
    label: usageActionLabels[action],
    used: usageRows.filter((row) => row.action === action).length,
    limit: getDailyAllowance(action),
  }));

  return {
    resumeGroupCount,
    resumeVersionCount,
    applicationCount,
    pendingCount: statusCounts.PENDING ?? 0,
    acceptedCount: statusCounts.ACCEPTED ?? 0,
    rejectedCount: statusCounts.REJECTED ?? 0,
    averageMatchScore:
      averageMatchRows[0]?.value === null
        ? null
        : Math.round(Number(averageMatchRows[0]?.value ?? 0)),
    recentApplications,
    recentDocuments,
    usage,
  };
}
