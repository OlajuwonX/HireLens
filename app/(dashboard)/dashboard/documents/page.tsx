import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentFilters } from "@/features/documents/components/document-filters";
import { DocumentFeed } from "@/features/documents/components/document-feed";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { getDocumentBoard } from "@/features/documents/server/document.service";
import { DOCUMENT_PAGE_SIZE } from "@/features/documents/constants";

export const metadata: Metadata = {
  title: "AI Documents",
};

function readParam(
  raw: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = raw[key];

  return typeof value === "string" ? value : "";
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireDatabaseUser();
  const raw = await searchParams;

  const filters = {
    q: readParam(raw, "q"),
    type: readParam(raw, "type"),
    from: readParam(raw, "from"),
    to: readParam(raw, "to"),
  };
  const hasFilters = Object.values(filters).some(Boolean);

  const documents = await getDocumentBoard({
    userId: user.id,
    filters,
    limit: DOCUMENT_PAGE_SIZE + 1,
  });

  const page = documents.slice(0, DOCUMENT_PAGE_SIZE);
  const nextCursor =
    documents.length > DOCUMENT_PAGE_SIZE
      ? page[page.length - 1]?.createdAt.toISOString()
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Documents"
        description="Everything you have saved from an analysis, ready to edit or download."
        action={
          <Button asChild>
            <Link href="/dashboard/jobs">Go to Saved Jobs</Link>
          </Button>
        }
      />

      <Suspense fallback={null}>
        <DocumentFilters />
      </Suspense>

      {page.length === 0 ? (
        <EmptyState
          title={
            hasFilters ? "Nothing matches those filters" : "No documents yet"
          }
          description={
            hasFilters
              ? "Try a different search, type or date range."
              : "Open a saved job and save any AI result to keep it here."
          }
          action={
            hasFilters ? null : (
              <Button asChild>
                <Link href="/dashboard/jobs">Go to Saved Jobs</Link>
              </Button>
            )
          }
        />
      ) : (
        <DocumentFeed
          key={JSON.stringify(filters)}
          initialRows={page}
          initialCursor={nextCursor}
          filters={filters}
        />
      )}
    </div>
  );
}
