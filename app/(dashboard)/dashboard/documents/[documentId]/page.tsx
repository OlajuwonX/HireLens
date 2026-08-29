import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { DocumentActions } from "@/features/documents/components/document-actions";
import { DocumentEditForm } from "@/features/documents/components/document-edit-form";
import { ResumeEditor } from "@/features/documents/components/resume-editor";
import {
  documentTypeLabels,
  type DOCUMENT_TYPES,
} from "@/features/documents/constants";
import {
  documentIsInResumeLibrary,
  getDocumentActivity,
  getOwnedDocument,
} from "@/features/documents/server/document.service";
import { findResumeDesignSource } from "@/features/documents/server/resume-design.service";
import { DocumentActivityLog } from "@/features/documents/components/document-activity";
import { BackButton } from "@/components/layout/back-button";

export const metadata: Metadata = {
  title: "AI Document",
};

type DocumentPageProps = {
  params: Promise<{ documentId: string }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const user = await requireDatabaseUser();
  const { documentId } = await params;
  const row = await getOwnedDocument({ userId: user.id, publicId: documentId });

  if (!row) {
    notFound();
  }

  const [inLibrary, activities, designSource] = await Promise.all([
    documentIsInResumeLibrary({ userId: user.id, row }),
    getDocumentActivity({ userId: user.id, documentId: row.document.id }),
    findResumeDesignSource({ userId: user.id, publicId: documentId }),
  ]);

  const { document, jobTitle, jobCompany, resumeTitle, versionLabel } = row;

  const sourceCard = (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="shrink-0">
        <CardTitle>Source</CardTitle>
      </CardHeader>
      <CardContent className="hl-scroll min-h-0 flex-1 space-y-3 overflow-y-auto text-meta text-text-secondary">
        <p>
          <span className="font-medium text-text-primary">Job: </span>
          {jobTitle && jobCompany ? `${jobTitle} at ${jobCompany}` : "None"}
        </p>
        <p>
          <span className="font-medium text-text-primary">Resume: </span>
          {versionLabel
            ? `${resumeTitle ? `${resumeTitle} - ` : ""}${versionLabel}`
            : "None"}
        </p>
        <p>
          <span className="font-medium text-text-primary">Created: </span>
          {document.createdAt.toLocaleDateString()}
        </p>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="font-mono text-system uppercase text-text-muted">
            Activity
          </p>
          <DocumentActivityLog activities={activities} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <BackButton href="/dashboard/documents" label="AI Documents" />

      <PageHeader
        title={documentTypeLabels[document.type]}
        description={
          jobTitle && jobCompany
            ? `${jobTitle} at ${jobCompany}`
            : "Editable generated document"
        }
      />

      <DocumentActions
        publicId={document.publicId}
        type={document.type as (typeof DOCUMENT_TYPES)[number]}
        label={documentTypeLabels[document.type]}
        content={document.editedContent}
        hasFile={Boolean(document.fileAssetId)}
        inLibrary={inLibrary}
        resumeDesign={designSource ? designSource.selection : null}
      />

      {designSource ? (
        <div className="space-y-6">
          <Card className="min-w-0">
            <CardContent className="p-4 sm:p-5">
              <ResumeEditor
                publicId={document.publicId}
                initialResume={designSource.resume}
                initialVersion={designSource.editVersion}
                selection={designSource.selection}
              />
            </CardContent>
          </Card>

          <div className="lg:max-w-md">{sourceCard}</div>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
          <Card className="min-w-0">
            <CardContent className="p-4 sm:p-5">
              <DocumentEditForm
                publicId={document.publicId}
                content={document.editedContent}
              />
            </CardContent>
          </Card>

          <div className="lg:sticky lg:top-0 lg:max-h-[calc(100vh-8rem)]">
            {sourceCard}
          </div>
        </div>
      )}
    </div>
  );
}
