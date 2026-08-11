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
import {
  FileDown,
  FileText,
  ListChecks,
  Mail,
  MessageSquare,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
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

const descriptions: Record<AiView, string> = {
  RECOMMENDATIONS: "What to change on this resume for this role.",
  KEYWORD_ANALYSIS:
    "Which posting keywords your resume proves, and which it does not.",
  IMPROVED_RESUME:
    "A rewritten resume built only from evidence already on yours.",
  BULLET_REWRITE: "Weak bullets rewritten without changing the facts.",
  PROFESSIONAL_SUMMARY: "A summary aimed at this posting.",
  COVER_LETTER: "A cover letter drawn from your verified experience.",
  APPLICATION_EMAIL: "A short application email with a subject line.",
  FOLLOW_UP_MESSAGE: "A follow-up you can send after applying.",
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

export function ApplicationAiActions({
  applicationPublicId,
  result,
}: {
  applicationPublicId: string;
  result: StoredApplicationIntelligence | null;
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
          Everything below came from the single analysis already run for this
          application. Opening any of these costs no AI usage.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {AI_VIEWS.map((view) => {
          const Icon = icons[view];
          const populated = viewIsPopulated(result, view);
          const content = viewToPlainText(result, view);

          return (
            <AiDocumentModal
              key={view}
              title={aiViewLabels[view]}
              description={descriptions[view]}
              content={content}
              footer={
                <SaveDocumentButton
                  applicationPublicId={applicationPublicId}
                  view={view}
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
                  className="h-auto min-h-12 items-start py-2"
                >
                  <Icon className="mt-0.5 size-4" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-meta font-semibold">
                      {aiViewLabels[view]}
                    </span>
                    <span className="block text-label font-normal text-text-secondary">
                      {populated ? descriptions[view] : "Not returned"}
                    </span>
                  </span>
                </Button>
              }
            >
              {panelFor(view, result)}
            </AiDocumentModal>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 text-label text-text-muted">
        <FileDown className="size-3.5" aria-hidden />
        Save any result to AI Documents to edit, download or keep it.
      </p>
    </section>
  );
}
