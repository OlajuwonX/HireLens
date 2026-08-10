import Link from "next/link";
import { AnalysisReport } from "@/features/analyses/components/analysis-report";
import { RequirementMatrix } from "@/features/analyses/components/requirement-matrix";
import { getAnalysisReport } from "@/features/analyses/server/analysis-report.service";
import { listDocumentsForApplication } from "@/features/documents/server/document.repository";
import { documentTypeLabels } from "@/features/documents/constants";
import { ApplicationAiActions } from "@/features/documents/components/application-ai-actions";
import {
  getApplicationTimeline,
  getOwnedApplication,
} from "@/features/applications/server/application.service";
import {
  employmentTypeLabels,
  workArrangementLabels,
} from "@/features/jobs/constants";
import { ApplicationDrawer } from "./application-drawer";
import { ApplicationStatusBadge } from "./application-status-badge";
import { StatusSelectForm } from "./status-select-form";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-meta text-text-secondary">{label}</dt>
      <dd className="text-right text-meta text-text-primary">{value}</dd>
    </div>
  );
}

export async function SavedJobDrawer({
  userId,
  publicId,
  closeHref,
}: {
  userId: string;
  publicId: string;
  closeHref: string;
}) {
  const row = await getOwnedApplication({ userId, publicId });

  if (!row) {
    return null;
  }

  const [report, activities, documents] = await Promise.all([
    row.application.analysisId
      ? getAnalysisReport({ userId, analysisId: row.application.analysisId })
      : Promise.resolve(null),
    getApplicationTimeline({ userId, publicId }),
    listDocumentsForApplication({ userId, applicationId: row.application.id }),
  ]);

  const matches = report?.matches ?? [];

  const overview = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ApplicationStatusBadge status={row.application.status} />
        <StatusSelectForm
          publicId={row.application.publicId}
          status={row.application.status}
          selectId={`status-drawer-${row.application.publicId}`}
        />
      </div>

      <dl>
        <Row label="Resume" value={row.versionLabel ?? "Not set"} />
        {row.resumeTitle ? (
          <Row label="Resume group" value={row.resumeTitle} />
        ) : null}
        {row.job.location ? (
          <Row label="Location" value={row.job.location} />
        ) : null}
        <Row
          label="Arrangement"
          value={workArrangementLabels[row.job.workArrangement]}
        />
        <Row
          label="Employment"
          value={employmentTypeLabels[row.job.employmentType]}
        />
        {row.job.deadlineAt ? (
          <Row
            label="Deadline"
            value={row.job.deadlineAt.toLocaleDateString()}
          />
        ) : null}
        <Row label="Added" value={row.application.createdAt.toLocaleDateString()} />
      </dl>

      {row.job.sourceUrl ? (
        <Link
          href={row.job.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-block break-all text-label text-info underline-offset-4 hover:underline"
        >
          View original posting
        </Link>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-section-title font-semibold text-text-primary">
          Job description
        </h3>
        <p className="whitespace-pre-wrap wrap-break-word text-meta leading-relaxed text-text-secondary">
          {row.job.description}
        </p>
      </section>

      {row.job.requirements ? (
        <section className="space-y-2">
          <h3 className="text-section-title font-semibold text-text-primary">
            Requirements
          </h3>
          <p className="whitespace-pre-wrap wrap-break-word text-meta leading-relaxed text-text-secondary">
            {row.job.requirements}
          </p>
        </section>
      ) : null}

      {activities && activities.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-section-title font-semibold text-text-primary">
            Activity
          </h3>
          <ol className="space-y-2">
            {activities.map((activity) => (
              <li key={activity.id} className="border-l-2 border-border pl-3">
                <p className="text-meta text-text-primary">{activity.title}</p>
                <time className="font-mono text-system text-text-muted">
                  {activity.createdAt.toLocaleString()}
                </time>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <ApplicationAiActions
        jobPublicId={row.job.publicId}
        applicationPublicId={row.application.publicId}
        resumeVersionPublicId={row.versionPublicId}
      />
    </div>
  );

  const analysis = row.analysisPublicId ? (
    <div className="space-y-6">
      <AnalysisReport
        result={report?.result ?? null}
        suggestions={report?.suggestions ?? []}
      />
      <RequirementMatrix rows={matches} analysisPublicId={row.analysisPublicId} />
      <ApplicationAiActions
        jobPublicId={row.job.publicId}
        applicationPublicId={row.application.publicId}
        resumeVersionPublicId={row.versionPublicId}
      />
    </div>
  ) : (
    <div className="space-y-5">
      <p className="text-meta text-text-secondary">
        No analysis is attached to this application yet.
      </p>
      <ApplicationAiActions
        jobPublicId={row.job.publicId}
        applicationPublicId={row.application.publicId}
        resumeVersionPublicId={row.versionPublicId}
      />
    </div>
  );

  const documentsPanel =
    documents.length > 0 ? (
      <ul className="divide-y divide-border">
        {documents.map((document) => (
          <li key={document.publicId} className="py-3">
            <Link
              href={`/dashboard/documents/${document.publicId}`}
              className="text-meta font-medium text-text-primary underline-offset-4 hover:underline"
            >
              {documentTypeLabels[document.type]}
            </Link>
            <p className="font-mono text-system text-text-muted">
              {document.createdAt.toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-meta text-text-secondary">
        Nothing generated for this application yet.
      </p>
    );

  return (
    <ApplicationDrawer
      title={row.job.title}
      subtitle={row.job.company}
      closeHref={closeHref}
      overview={overview}
      analysis={analysis}
      documents={documentsPanel}
    />
  );
}
