import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { DocumentEditForm } from "@/features/documents/components/document-edit-form";
import { documentTypeLabels } from "@/features/documents/constants";
import { getOwnedDocument } from "@/features/documents/server/document.service";

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

  const { document, jobTitle, jobCompany, resumeTitle, versionLabel } = row;

  return (
    <div className="space-y-6">
      <PageHeader
        title={documentTypeLabels[document.type]}
        description={
          jobTitle && jobCompany
            ? `${jobTitle} at ${jobCompany}`
            : "Editable generated document"
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent className="p-5">
            <DocumentEditForm
              publicId={document.publicId}
              content={document.editedContent}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-meta text-text-secondary">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
