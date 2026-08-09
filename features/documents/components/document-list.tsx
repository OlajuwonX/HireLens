import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { documentTypeLabels } from "../constants";
import type { DocumentRow } from "../server/document.repository";

export function DocumentList({ rows }: { rows: DocumentRow[] }) {
  return (
    <div className="grid gap-3">
      {rows.map(({ document, jobTitle, jobCompany, resumeTitle, versionLabel }) => (
        <Link key={document.publicId} href={`/dashboard/documents/${document.publicId}`}>
          <Card className="transition-colors hover:bg-surface-secondary">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">
                    {documentTypeLabels[document.type]}
                  </p>
                  <p className="mt-1 text-meta text-text-secondary">
                    {jobTitle && jobCompany
                      ? `${jobTitle} at ${jobCompany}`
                      : "No linked job"}
                  </p>
                </div>
                <p className="font-mono text-system text-text-muted">
                  {document.updatedAt.toLocaleDateString()}
                </p>
              </div>
              {versionLabel ? (
                <p className="mt-3 text-label text-text-muted">
                  {resumeTitle ? `${resumeTitle} - ` : ""}
                  {versionLabel}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
