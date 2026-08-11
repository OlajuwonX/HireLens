import {
  FileText,
  ListChecks,
  Mail,
  MessageSquare,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { KeywordGapPanel } from "@/features/analyses/components/keyword-gap-panel";
import { RecommendationList } from "@/features/analyses/components/recommendation-list";
import {
  AI_VIEWS,
  aiViewLabels,
  viewIsPopulated,
  viewToPlainText,
  type AiView,
} from "@/features/analyses/server/analysis.mapper";
import type { StoredApplicationIntelligence } from "@/lib/ai/schemas/application-intelligence.schema";
import { AiDocumentModal, PlainTextPanel } from "./ai-document-modal";
import { BulletRewritePanel } from "./bullet-rewrite-panel";
import { ImprovedResumePanel } from "./improved-resume-panel";
import { SaveDocumentButton } from "./save-document-button";

const icons: Record<
  AiView,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  RECOMMENDATIONS: ListChecks,
  KEYWORD_ANALYSIS: Search,
  IMPROVED_RESUME: Sparkles,
  BULLET_REWRITE: FileText,
  PROFESSIONAL_SUMMARY: UserRound,
  COVER_LETTER: FileText,
  APPLICATION_EMAIL: Mail,
  FOLLOW_UP_MESSAGE: MessageSquare,
};

function panelFor(
  view: AiView,
  result: StoredApplicationIntelligence,
): ReactNode {
  switch (view) {
    case "RECOMMENDATIONS":
      return <RecommendationList items={result.recommendations} />;
    case "KEYWORD_ANALYSIS":
      return <KeywordGapPanel analysis={result.keywordAnalysis} />;
    case "IMPROVED_RESUME":
      return <ImprovedResumePanel resume={result.improvedResume} />;
    case "BULLET_REWRITE":
      return <BulletRewritePanel items={result.bulletRewrites} />;
    default:
      return <PlainTextPanel content={viewToPlainText(result, view)} />;
  }
}

function AiResultCard({
  view,
  applicationPublicId,
  result,
  savedDocumentId,
}: {
  view: AiView;
  applicationPublicId: string;
  result: StoredApplicationIntelligence;
  savedDocumentId: string | null;
}) {
  const Icon = icons[view];
  const populated = viewIsPopulated(result, view);

  return (
    <AiDocumentModal
      title={aiViewLabels[view]}
      content={viewToPlainText(result, view)}
      downloadHref={
        view === "IMPROVED_RESUME" && savedDocumentId
          ? `/dashboard/documents/${savedDocumentId}/download`
          : undefined
      }
      footer={
        <SaveDocumentButton
          applicationPublicId={applicationPublicId}
          view={view}
          alreadySaved={Boolean(savedDocumentId)}
        />
      }
      trigger={
        <Button
          type="button"
          variant="outline"
          size="row"
          align="start"
          block
          disabled={!populated}
          className="gap-2"
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{aiViewLabels[view]}</span>
        </Button>
      }
    >
      {panelFor(view, result)}
    </AiDocumentModal>
  );
}

export function ApplicationAiActions({
  applicationPublicId,
  result,
  savedDocuments,
}: {
  applicationPublicId: string;
  result: StoredApplicationIntelligence | null;
  savedDocuments: Partial<Record<AiView, string>>;
}) {
  if (!result) {
    return (
      <section className="space-y-2 border-t border-border pt-5">
        <h3 className="text-section-title font-semibold text-text-primary">
          AI results
        </h3>
        <p className="text-meta text-text-secondary">
          Run the analysis to unlock every AI result for this application.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3 border-t border-border pt-5">
      <div>
        <h3 className="text-section-title font-semibold text-text-primary">
          AI results
        </h3>
        <p className="text-meta text-text-secondary">
          Everything here came from the single analysis already run. Opening any
          of these costs no AI usage.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {AI_VIEWS.map((view) => (
          <AiResultCard
            key={view}
            view={view}
            applicationPublicId={applicationPublicId}
            result={result}
            savedDocumentId={savedDocuments[view] ?? null}
          />
        ))}
      </div>
    </section>
  );
}
