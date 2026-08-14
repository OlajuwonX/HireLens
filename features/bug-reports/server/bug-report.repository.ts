import "server-only";

import { and, count, desc, eq, gte, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  bugReports,
  users,
  type BugStatus,
  type NewBugReport,
} from "@/lib/db/schema";
import type { BugFilters } from "../schemas/bug-report.schema";

const listRowShape = {
  publicId: bugReports.publicId,
  title: bugReports.title,
  category: bugReports.category,
  status: bugReports.status,
  route: bugReports.route,
  createdAt: bugReports.createdAt,
  reporterEmail: users.email,
};

export type BugReportListRow = {
  publicId: string;
  title: string;
  category: (typeof bugReports.category.enumValues)[number];
  status: BugStatus;
  route: string;
  createdAt: Date;
  reporterEmail: string;
};

export async function createBugReport(input: NewBugReport) {
  const [report] = await db.insert(bugReports).values(input).returning();
  return report;
}

export async function countReportsInWindow(input: {
  userId: string;
  since: Date;
}) {
  const [row] = await db
    .select({ value: count() })
    .from(bugReports)
    .where(
      and(
        eq(bugReports.userId, input.userId),
        gte(bugReports.createdAt, input.since),
      ),
    );

  return row?.value ?? 0;
}

export async function listBugReports(input: {
  filters: BugFilters;
  limit: number;
  offset: number;
}): Promise<BugReportListRow[]> {
  const conditions: (SQL | undefined)[] = [];

  if (input.filters.q) {
    const term = `%${input.filters.q}%`;

    conditions.push(
      or(ilike(bugReports.title, term), ilike(users.email, term)),
    );
  }

  if (input.filters.status) {
    conditions.push(eq(bugReports.status, input.filters.status));
  }

  if (input.filters.category) {
    conditions.push(eq(bugReports.category, input.filters.category));
  }

  return db
    .select(listRowShape)
    .from(bugReports)
    .innerJoin(users, eq(users.id, bugReports.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bugReports.createdAt))
    .limit(input.limit)
    .offset(input.offset);
}

export async function countBugReportsByStatus() {
  const rows = await db
    .select({ status: bugReports.status, value: count() })
    .from(bugReports)
    .groupBy(bugReports.status);

  return rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.status] = row.value;
    return counts;
  }, {});
}

export async function findBugReportByPublicId(publicId: string) {
  const [row] = await db
    .select({
      report: bugReports,
      reporterEmail: users.email,
      reporterPublicId: users.publicId,
    })
    .from(bugReports)
    .innerJoin(users, eq(users.id, bugReports.userId))
    .where(eq(bugReports.publicId, publicId))
    .limit(1);

  return row ?? null;
}

export async function updateBugReportStatus(input: {
  publicId: string;
  status: BugStatus;
}) {
  const [report] = await db
    .update(bugReports)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(bugReports.publicId, input.publicId))
    .returning();

  return report ?? null;
}
