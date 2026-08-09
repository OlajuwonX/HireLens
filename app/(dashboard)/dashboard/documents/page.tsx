import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentList } from "@/features/documents/components/document-list";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { getDocumentBoard } from "@/features/documents/server/document.service";

export const metadata: Metadata = {
  title: "AI Documents",
};

export default async function DocumentsPage() {
  const user = await requireDatabaseUser();
  const documents = await getDocumentBoard(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Documents"
        description="Editable application documents generated from your saved jobs and resume evidence."
        action={
          <Button asChild>
            <Link href="/dashboard/documents/new">Generate</Link>
          </Button>
        }
      />

      {documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Generate a cover letter, email, subject line, or follow-up from a saved job."
          action={
            <Button asChild>
              <Link href="/dashboard/documents/new">Generate document</Link>
            </Button>
          }
        />
      ) : (
        <DocumentList rows={documents} />
      )}
    </div>
  );
}
