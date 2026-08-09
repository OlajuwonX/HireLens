import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applications,
  generatedDocuments,
  jobs,
  resumes,
  resumeVersions,
  type GeneratedDocument,
  type NewGeneratedDocument,
} from "@/lib/db/schema";

export type DocumentRow = {
  document: GeneratedDocument;
  jobTitle: string | null;
  jobCompany: string | null;
  resumeTitle: string | null;
  versionLabel: string | null;
};

const rowShape = {
  document: generatedDocuments,
  jobTitle: jobs.title,
  jobCompany: jobs.company,
  resumeTitle: resumes.title,
  versionLabel: resumeVersions.label,
};

export async function listDocumentsForUser(userId: string): Promise<DocumentRow[]> {
  return db
    .select(rowShape)
    .from(generatedDocuments)
    .leftJoin(jobs, eq(jobs.id, generatedDocuments.jobId))
    .leftJoin(resumeVersions, eq(resumeVersions.id, generatedDocuments.resumeVersionId))
    .leftJoin(resumes, eq(resumes.id, resumeVersions.resumeId))
    .where(eq(generatedDocuments.userId, userId))
    .orderBy(desc(generatedDocuments.updatedAt));
}

export async function listDocumentsForApplication(input: {
  userId: string;
  applicationId: string;
}) {
  return db
    .select()
    .from(generatedDocuments)
    .where(
      and(
        eq(generatedDocuments.userId, input.userId),
        eq(generatedDocuments.applicationId, input.applicationId),
      ),
    )
    .orderBy(desc(generatedDocuments.createdAt));
}

export async function findDocumentRowForUser(input: {
  userId: string;
  publicId: string;
}): Promise<DocumentRow | null> {
  const [row] = await db
    .select(rowShape)
    .from(generatedDocuments)
    .leftJoin(jobs, eq(jobs.id, generatedDocuments.jobId))
    .leftJoin(resumeVersions, eq(resumeVersions.id, generatedDocuments.resumeVersionId))
    .leftJoin(resumes, eq(resumes.id, resumeVersions.resumeId))
    .where(
      and(
        eq(generatedDocuments.userId, input.userId),
        eq(generatedDocuments.publicId, input.publicId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function createGeneratedDocument(input: NewGeneratedDocument) {
  const [document] = await db.insert(generatedDocuments).values(input).returning();
  return document;
}

export async function updateGeneratedDocumentForUser(input: {
  userId: string;
  publicId: string;
  editedContent: string;
}) {
  const [document] = await db
    .update(generatedDocuments)
    .set({ editedContent: input.editedContent, updatedAt: new Date() })
    .where(
      and(
        eq(generatedDocuments.userId, input.userId),
        eq(generatedDocuments.publicId, input.publicId),
      ),
    )
    .returning();

  return document ?? null;
}

export async function listDocumentApplicationOptions(userId: string) {
  return db
    .select({
      publicId: applications.publicId,
      status: applications.status,
      jobTitle: jobs.title,
      jobCompany: jobs.company,
    })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.lastActivityAt));
}
