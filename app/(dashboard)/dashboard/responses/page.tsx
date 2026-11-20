import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { ResponseCard } from "@/features/responses/components/response-card";
import { groupResponses } from "@/features/responses/group";
import { listApplicationCandidates, listResponses } from "@/features/responses/server/email.repository";
import { WORKER_SETTINGS_PATH } from "@/features/worker/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Responses",
};

export const maxDuration = 60;

const sections = [
  { key: "priority", title: "Priority", empty: "Interview invitations, assessments and offers appear here first." },
  { key: "review", title: "Needs your review", empty: "Nothing to check." },
  { key: "other", title: "Other updates", empty: "No other updates yet." },
] as const;

export default async function ResponsesPage() {
  const user = await requireDatabaseUser();
  const [rows, candidates] = await Promise.all([listResponses(user.id), listApplicationCandidates(user.id)]);
  const groups = groupResponses(rows);
  const applications = candidates.map((item) => ({ publicId: item.publicId, label: `${item.company} · ${item.title}` }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Responses"
        description="Employer replies to your applications, read from Gmail by your local worker. HireLens never replies for you."
      />

      <Alert tone="info">
        Connect Gmail in your{" "}
        <Link href={WORKER_SETTINGS_PATH} className="underline">
          local worker
        </Link>{" "}
        to see replies here. Only emails from companies you applied to leave your computer.
      </Alert>

      {rows.length === 0 ? (
        <EmptyState title="No responses yet" description="When employers reply, their messages will be sorted here." />
      ) : (
        sections.map((section) => (
          <section key={section.key} className="space-y-3">
            <h2 className="text-section-title font-semibold text-text-primary">
              {section.title} ({groups[section.key].length})
            </h2>
            {groups[section.key].length > 0 ? (
              <ul className="space-y-3">
                {groups[section.key].map((row) => (
                  <ResponseCard key={row.publicId} row={row} applications={applications} />
                ))}
              </ul>
            ) : (
              <p className="text-meta text-text-secondary">{section.empty}</p>
            )}
          </section>
        ))
      )}
    </div>
  );
}
