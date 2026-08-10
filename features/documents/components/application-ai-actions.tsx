 "use client";

import type { ComponentType } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FileText, Mail, MessageSquare, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeApplicationFormAction } from "@/features/applications/actions/application-actions";
import { initialApplicationFormState } from "@/features/applications/actions/application-form-state";
import { generateDocumentAction } from "../actions/document-actions";
import { initialDocumentFormState } from "../actions/document-form-state";
import { DOCUMENT_TYPES, documentTypeLabels } from "../constants";

type DocumentType = (typeof DOCUMENT_TYPES)[number];

const actions: {
  type: DocumentType;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  helper: string;
}[] = [
  {
    type: "IMPROVED_RESUME",
    icon: Sparkles,
    helper: "Rewrite resume content against this job.",
  },
  {
    type: "COVER_LETTER",
    icon: FileText,
    helper: "Create a focused cover letter.",
  },
  {
    type: "APPLICATION_EMAIL",
    icon: Mail,
    helper: "Draft a concise application email.",
  },
  {
    type: "PROFESSIONAL_SUMMARY",
    icon: FileText,
    helper: "Write a summary aimed at this role.",
  },
  {
    type: "KEYWORD_ANALYSIS",
    icon: Search,
    helper: "Find missing keywords and fit gaps.",
  },
  {
    type: "BULLET_REWRITE",
    icon: Sparkles,
    helper: "Improve resume bullets for this role.",
  },
  {
    type: "FOLLOW_UP_MESSAGE",
    icon: MessageSquare,
    helper: "Draft a follow-up message.",
  },
];

function AnalyzeButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" block disabled={pending}>
      <Search className="size-4" aria-hidden />
      {pending ? "Analyzing..." : "Analyze match"}
    </Button>
  );
}

function GenerateButton({
  icon: Icon,
  type,
  helper,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  type: DocumentType;
  helper: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="row"
      align="start"
      block
      disabled={pending}
      className="h-auto min-h-12 items-start py-2"
    >
      <Icon className="mt-0.5 size-4" aria-hidden />
      <span className="min-w-0">
        <span className="block text-meta font-semibold">
          {documentTypeLabels[type]}
        </span>
        <span className="block text-label font-normal text-text-secondary">
          {pending ? "Generating..." : helper}
        </span>
      </span>
    </Button>
  );
}

export function ApplicationAiActions({
  jobPublicId,
  applicationPublicId,
  resumeVersionPublicId,
}: {
  jobPublicId: string;
  applicationPublicId: string;
  resumeVersionPublicId: string | null;
}) {
  const [analysisState, analysisAction] = useActionState(
    analyzeApplicationFormAction,
    initialApplicationFormState,
  );
  const [documentState, documentAction] = useActionState(
    generateDocumentAction,
    initialDocumentFormState,
  );

  return (
    <section className="space-y-3 border-t border-border pt-5">
      <div>
        <h3 className="text-section-title font-semibold text-text-primary">
          Analyze and generate
        </h3>
        <p className="text-meta text-text-secondary">
          Run AI actions using this job, application and attached resume context.
        </p>
      </div>

      {analysisState.status === "error" ? (
        <p className="text-meta text-danger">{analysisState.message}</p>
      ) : null}
      {documentState.status === "error" ? (
        <p className="text-meta text-danger">{documentState.message}</p>
      ) : null}

      <form action={analysisAction}>
        <input type="hidden" name="publicId" value={applicationPublicId} />
        <AnalyzeButton />
      </form>

      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map(({ type, icon: Icon, helper }) => (
          <form key={type} action={documentAction}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="jobPublicId" value={jobPublicId} />
            <input
              type="hidden"
              name="applicationPublicId"
              value={applicationPublicId}
            />
            <input
              type="hidden"
              name="resumeVersionPublicId"
              value={resumeVersionPublicId ?? ""}
            />
            <GenerateButton icon={Icon} type={type} helper={helper} />
          </form>
        ))}
      </div>
    </section>
  );
}
