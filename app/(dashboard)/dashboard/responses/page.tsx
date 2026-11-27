import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { UrlFlagToast } from "@/components/ui/url-flag-toast";
import { GmailPanel } from "@/features/responses/components/gmail-panel";
import { ResponseCard } from "@/features/responses/components/response-card";
import { GMAIL_RESULT_MESSAGES, readGmailResult } from "@/features/responses/gmail";
import { groupResponses } from "@/features/responses/group";
import { listApplicationCandidates, listResponses } from "@/features/responses/server/email.repository";
import { loadGmailPanel } from "@/features/responses/server/gmail/gmail-panel-state";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Replies",
};

export const maxDuration = 60;

const sections = [
  { key: "priority", title: "Priority", empty: "Interview invitations, assessments and offers appear here first." },
  { key: "review", title: "Needs your review", empty: "Nothing to check." },
  { key: "other", title: "Other updates", empty: "No other updates yet." },
] as const;

const GMAIL_FLAGS = ["gmail"] as const;

export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireDatabaseUser();
  const gmailResult = readGmailResult((await searchParams).gmail);
  const [rows, candidates, gmail] = await Promise.all([
    listResponses(user.id),
    listApplicationCandidates(user.id),
    loadGmailPanel(user.id),
  ]);
  const groups = groupResponses(rows);
  const applications = candidates.map((item) => ({ publicId: item.publicId, label: `${item.company} · ${item.title}` }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Replies"
        description="Employer replies to your applications, read from your Gmail. HireLens never replies for you."
      />

      {gmailResult === "connected" ? <UrlFlagToast message={GMAIL_RESULT_MESSAGES.connected} flags={GMAIL_FLAGS} /> : null}
      {gmailResult && gmailResult !== "connected" ? <Alert tone="warning">{GMAIL_RESULT_MESSAGES[gmailResult]}</Alert> : null}

      <GmailPanel state={gmail.state} checkedLabel={gmail.checkedLabel} />

      {rows.length === 0 ? (
        <EmptyState
          title="No replies yet"
          description={
            gmail.state === "connected"
              ? "HireLens checks Gmail every day. Replies from companies you applied to appear here."
              : "Connect Gmail above and replies from companies you applied to are sorted here."
          }
        />
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
