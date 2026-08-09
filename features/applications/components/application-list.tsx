import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApplicationRow } from "@/features/applications/server/application.repository";
import { ApplicationStageBadge } from "./application-stage-badge";
import { StageSelectForm } from "./stage-select-form";

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString() : "—";
}

export function ApplicationList({ rows }: { rows: ApplicationRow[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Resume</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead>Last activity</TableHead>
              <TableHead>Move</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ application, jobTitle, jobCompany, versionLabel }) => (
              <TableRow key={application.publicId}>
                <TableCell>
                  <Link
                    href={`/dashboard/applications/${application.publicId}`}
                    className="font-medium text-text-primary underline-offset-4 hover:underline"
                  >
                    {jobTitle}
                  </Link>
                  <span className="block text-label text-text-muted">
                    {jobCompany}
                  </span>
                </TableCell>
                <TableCell>
                  <ApplicationStageBadge stage={application.stage} />
                </TableCell>
                <TableCell>{versionLabel ?? "—"}</TableCell>
                <TableCell>{formatDate(application.followUpAt)}</TableCell>
                <TableCell>{formatDate(application.lastActivityAt)}</TableCell>
                <TableCell>
                  <StageSelectForm
                    publicId={application.publicId}
                    stage={application.stage}
                    labelId={`stage-table-${application.publicId}`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface md:hidden">
        {rows.map(({ application, jobTitle, jobCompany, versionLabel }) => (
          <li key={application.publicId} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/applications/${application.publicId}`}
                  className="block truncate text-meta font-semibold text-text-primary"
                >
                  {jobTitle}
                </Link>
                <p className="truncate text-label text-text-muted">
                  {jobCompany}
                </p>
              </div>
              <ApplicationStageBadge stage={application.stage} />
            </div>

            <dl className="grid grid-cols-2 gap-2 text-label text-text-secondary">
              <div>
                <dt className="text-text-muted">Resume</dt>
                <dd>{versionLabel ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Follow-up</dt>
                <dd>{formatDate(application.followUpAt)}</dd>
              </div>
            </dl>

            <StageSelectForm
              publicId={application.publicId}
              stage={application.stage}
              labelId={`stage-card-${application.publicId}`}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
