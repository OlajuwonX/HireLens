import Link from "next/link";
import {
  CLOSED_STAGES,
  PIPELINE_STAGES,
  applicationStageLabels,
} from "@/features/applications/constants";
import type { ApplicationRow } from "@/features/applications/server/application.repository";
import { StageSelectForm } from "./stage-select-form";

export function ApplicationPipeline({ rows }: { rows: ApplicationRow[] }) {
  const columns = [...PIPELINE_STAGES, ...CLOSED_STAGES].map((stage) => ({
    stage,
    items: rows.filter((row) => row.application.stage === stage),
  }));

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {columns.map(({ stage, items }) => (
        <section
          key={stage}
          aria-label={applicationStageLabels[stage]}
          className="rounded-card border border-border bg-surface-secondary p-3"
        >
          <div className="flex items-center justify-between gap-2 px-1 pb-3">
            <h2 className="font-mono text-system font-medium uppercase text-text-muted">
              {applicationStageLabels[stage]}
            </h2>
            <span className="font-mono text-system tabular-nums text-text-muted">
              {items.length}
            </span>
          </div>

          {items.length === 0 ? (
            <p className="px-1 pb-1 text-label text-text-muted">Nothing here.</p>
          ) : (
            <ul className="space-y-2">
              {items.map(({ application, jobTitle, jobCompany }) => (
                <li
                  key={application.publicId}
                  className="space-y-2.5 rounded-card border border-border bg-surface p-3"
                >
                  <Link
                    href={`/dashboard/applications/${application.publicId}`}
                    className="block"
                  >
                    <p className="truncate text-meta font-medium text-text-primary">
                      {jobTitle}
                    </p>
                    <p className="truncate text-label text-text-muted">
                      {jobCompany}
                    </p>
                  </Link>

                  {application.followUpAt ? (
                    <p className="font-mono text-system text-text-muted">
                      Follow up {application.followUpAt.toLocaleDateString()}
                    </p>
                  ) : null}

                  <StageSelectForm
                    publicId={application.publicId}
                    stage={application.stage}
                    labelId={`stage-pipeline-${application.publicId}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
