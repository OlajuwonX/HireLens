import "server-only";

import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  applications,
  documentActivities,
  documentActivityKind,
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
  jobPublicId: string | null;
  resumeTitle: string | null;
  resumeId: string | null;
  versionLabel: string | null;
  versionPublicId: string | null;
};

const rowShape = {
  document: generatedDocuments,
  jobTitle: jobs.title,
  jobCompany: jobs.company,
  jobPublicId: jobs.publicId,
  resumeTitle: resumes.title,
  resumeId: resumes.id,
  versionLabel: resumeVersions.label,
  versionPublicId: resumeVersions.publicId,
};

export type DocumentFilters = {
  q?: string;
  type?: string;
  from?: string;
  to?: string;
};

const listRowShape = {
  publicId: generatedDocuments.publicId,
  type: generatedDocuments.type,
  fileAssetId: generatedDocuments.fileAssetId,
  createdAt: generatedDocuments.createdAt,
  jobTitle: jobs.title,
  jobCompany: jobs.company,
  versionLabel: resumeVersions.label,
};

export type DocumentListRow = {
  publicId: string;
  type: GeneratedDocument["type"];
  fileAssetId: string | null;
  createdAt: Date;
  jobTitle: string | null;
  jobCompany: string | null;
  versionLabel: string | null;
};

export async function listDocumentsForUser(
  userId: string,
  filters: DocumentFilters = {},
  limit = 24,
  cursor?: string,
): Promise<DocumentListRow[]> {
  const conditions: (SQL | undefined)[] = [
    eq(generatedDocuments.userId, userId),
  ];

  if (filters.q) {
    const term = `%${filters.q}%`;

    conditions.push(or(ilike(jobs.title, term), ilike(jobs.company, term)));
  }

  if (filters.type) {
    conditions.push(
      inArray(generatedDocuments.type, [
        filters.type as (typeof generatedDocuments.type.enumValues)[number],
      ]),
    );
  }

  if (filters.from) {
    conditions.push(gte(generatedDocuments.createdAt, new Date(filters.from)));
  }

  if (filters.to) {
    const end = new Date(filters.to);

    end.setDate(end.getDate() + 1);
    conditions.push(lt(generatedDocuments.createdAt, end));
  }

  if (cursor) {
    conditions.push(lt(generatedDocuments.createdAt, new Date(cursor)));
  }

  return db
    .select(listRowShape)
    .from(generatedDocuments)
    .leftJoin(jobs, eq(jobs.id, generatedDocuments.jobId))
    .leftJoin(
      resumeVersions,
      eq(resumeVersions.id, generatedDocuments.resumeVersionId),
    )
    .where(and(...conditions))
    .orderBy(desc(generatedDocuments.createdAt))
    .limit(limit);
}

export async function listDocumentsForApplication(input: {
  userId: string;
  applicationId: string;
}) {
  return db
    .select({
      publicId: generatedDocuments.publicId,
      type: generatedDocuments.type,
      createdAt: generatedDocuments.createdAt,
    })
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
    .leftJoin(
      resumeVersions,
      eq(resumeVersions.id, generatedDocuments.resumeVersionId),
    )
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
  const [document] = await db
    .insert(generatedDocuments)
    .values(input)
    .returning();
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

export async function updateGeneratedDocumentDesign(input: {
  userId: string;
  publicId: string;
  resumeTemplate: string;
  resumeTypography: string;
  resumeSpacing: string;
}) {
  const [document] = await db
    .update(generatedDocuments)
    .set({
      resumeTemplate: input.resumeTemplate,
      resumeTypography: input.resumeTypography,
      resumeSpacing: input.resumeSpacing,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(generatedDocuments.userId, input.userId),
        eq(generatedDocuments.publicId, input.publicId),
      ),
    )
    .returning();

  return document ?? null;
}

export async function deleteGeneratedDocumentForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [document] = await db
    .delete(generatedDocuments)
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

export async function listDocumentActivities(input: {
  userId: string;
  documentId: string;
}) {
  return db
    .select()
    .from(documentActivities)
    .where(
      and(
        eq(documentActivities.userId, input.userId),
        eq(documentActivities.documentId, input.documentId),
      ),
    )
    .orderBy(desc(documentActivities.createdAt));
}

export async function recordDocumentActivity(input: {
  userId: string;
  documentId: string;
  kind: (typeof documentActivityKind.enumValues)[number];
}) {
  await db.insert(documentActivities).values(input);
}

export async function updateGeneratedDocumentIfChanged(input: {
  userId: string;
  publicId: string;
  editedContent: string;
}) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: generatedDocuments.id,
        editedContent: generatedDocuments.editedContent,
      })
      .from(generatedDocuments)
      .where(
        and(
          eq(generatedDocuments.userId, input.userId),
          eq(generatedDocuments.publicId, input.publicId),
        ),
      )
      .limit(1);

    if (!current) {
      return { document: null, changed: false };
    }

    if (current.editedContent === input.editedContent) {
      return { document: current, changed: false };
    }

    const [document] = await tx
      .update(generatedDocuments)
      .set({ editedContent: input.editedContent, updatedAt: new Date() })
      .where(
        and(
          eq(generatedDocuments.userId, input.userId),
          eq(generatedDocuments.publicId, input.publicId),
        ),
      )
      .returning();

    await tx.insert(documentActivities).values({
      userId: input.userId,
      documentId: current.id,
      kind: "EDITED",
    });

    return { document, changed: true };
  });
}
