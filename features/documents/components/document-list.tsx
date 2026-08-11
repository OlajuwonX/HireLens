import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { documentTypeLabels } from "../constants";
import type { DocumentRow } from "../server/document.repository";

export function DocumentList({ rows }: { rows: DocumentRow[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
      {rows.map(({ document, jobTitle, jobCompany, versionLabel }) => (
        <li key={document.publicId}>
          <Link
            href={`/dashboard/documents/${document.publicId}`}
            className="flex h-full flex-col gap-2 rounded-card border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-surface-secondary focus-visible:border-accent-hover sm:p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-meta font-semibold text-text-primary">
                {documentTypeLabels[document.type]}
              </p>
              {document.fileAssetId ? (
                <Badge tone="green" className="shrink-0 gap-1">
                  <FileCheck2 className="size-3" aria-hidden />
                  PDF
                </Badge>
              ) : null}
            </div>

            <p className="truncate text-label text-text-secondary">
              {jobTitle && jobCompany
                ? `${jobTitle} - ${jobCompany}`
                : "No linked job"}
            </p>

            <div className="mt-auto flex items-center justify-between gap-2 pt-1">
              <span className="truncate font-mono text-system text-text-muted">
                {versionLabel ?? "No resume"}
              </span>
              <span className="shrink-0 font-mono text-system text-text-muted">
                {document.createdAt.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
