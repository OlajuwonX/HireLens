"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Download, Library, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import {
  addImprovedResumeToLibraryAction,
  deleteDocumentAction,
  generateDocumentAction,
} from "../actions/document-actions";
import { initialDocumentFormState } from "../actions/document-form-state";
import type { DOCUMENT_TYPES } from "../constants";

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function DocumentActions({
  publicId,
  type,
  content,
  hasFile,
  jobPublicId,
  versionPublicId,
  applicationPublicId,
}: {
  publicId: string;
  type: (typeof DOCUMENT_TYPES)[number];
  content: string;
  hasFile: boolean;
  jobPublicId: string | null;
  versionPublicId: string | null;
  applicationPublicId: string | null;
}) {
  const [libraryState, addToLibrary] = useActionState(
    addImprovedResumeToLibraryAction,
    initialDocumentFormState,
  );
  const [regenerateState, regenerate] = useActionState(
    generateDocumentAction,
    initialDocumentFormState,
  );
  const notice =
    libraryState.status !== "idle" ? libraryState : regenerateState;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <CopyButton content={content} />

        {hasFile ? (
          <Button asChild variant="outline">
            <Link href={`/dashboard/documents/${publicId}/download`}>
              <Download className="size-4" aria-hidden />
              Download PDF
            </Link>
          </Button>
        ) : null}

        {jobPublicId ? (
          <form action={regenerate}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="jobPublicId" value={jobPublicId} />
            <input
              type="hidden"
              name="resumeVersionPublicId"
              value={versionPublicId ?? ""}
            />
            <input
              type="hidden"
              name="applicationPublicId"
              value={applicationPublicId ?? ""}
            />
            <Button type="submit" variant="outline">
              <RefreshCw className="size-4" aria-hidden />
              Regenerate
            </Button>
          </form>
        ) : null}

        {type === "IMPROVED_RESUME" && hasFile ? (
          <form action={addToLibrary}>
            <input type="hidden" name="publicId" value={publicId} />
            <Button type="submit" variant="outline">
              <Library className="size-4" aria-hidden />
              Add to resume library
            </Button>
          </form>
        ) : null}

        <DeleteConfirmButton
          action={deleteDocumentAction}
          publicId={publicId}
          title="Delete this document?"
          description="This removes the document and any generated PDF. It cannot be undone."
        />
      </div>

      {notice.status !== "idle" ? (
        <p
          className={
            notice.status === "error"
              ? "text-meta text-danger"
              : "text-meta text-text-secondary"
          }
        >
          {notice.message}
        </p>
      ) : null}
    </div>
  );
}
